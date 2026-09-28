begin;

-- =========================================================================
-- 0003_repo_storage_4fn: repo como storage + modelo normalizado (4FN)
-- =========================================================================

-- ---------------------------------------------------------------------
-- Helper: slugify en SQL (lower + aproximación sin unaccent + regexp)
-- ---------------------------------------------------------------------
create or replace function public._slugify(txt text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(
        translate(
          lower(coalesce(txt, '')),
          'áàäâãåéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
          'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNC'
        ),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
$$;

-- ---------------------------------------------------------------------
-- Tablas nuevas
-- ---------------------------------------------------------------------
create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null
);

-- ---------------------------------------------------------------------
-- posts: alteraciones
-- ---------------------------------------------------------------------
alter table public.posts rename column description to summary;
alter table public.posts add column if not exists cover_path text;
alter table public.posts add column if not exists updated_at timestamptz not null default now();
alter table public.posts add column if not exists series_id uuid references public.series (id) on delete set null;
alter table public.posts add column if not exists series_order int;

-- Migrar tags text[] -> tags/post_tags (se hace antes de crear post_tags con FK-only data)
create table if not exists public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create table if not exists public.post_sources (
  post_id uuid primary key references public.posts (id) on delete cascade,
  repo text not null,
  path text not null,
  commit_sha text not null check (commit_sha ~ '^[0-9a-f]{40}$'),
  synced_at timestamptz not null default now(),
  unique (repo, path)
);

create table if not exists public.newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts (id) on delete cascade,
  sent_at timestamptz not null default now()
);

create table if not exists public.newsletter_deliveries (
  send_id uuid not null references public.newsletter_sends (id) on delete cascade,
  subscriber_id uuid not null references public.subscribers (id) on delete cascade,
  status text not null check (status in ('sent', 'failed')),
  error text,
  attempted_at timestamptz not null default now(),
  primary key (send_id, subscriber_id)
);

-- Backfill de tags text[] -> tags + post_tags (si la columna existiera todavia)
do $$
declare
  has_tags_col boolean;
  r record;
  t text;
  tslug text;
  tid uuid;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'posts' and column_name = 'tags'
  ) into has_tags_col;

  if has_tags_col then
    for r in select id, tags from public.posts where tags is not null loop
      foreach t in array r.tags loop
        tslug := public._slugify(t);
        if tslug = '' then continue; end if;
        insert into public.tags (slug, name)
        values (tslug, t)
        on conflict (slug) do nothing;

        select id into tid from public.tags where slug = tslug;

        insert into public.post_tags (post_id, tag_id)
        values (r.id, tid)
        on conflict do nothing;
      end loop;
    end loop;
  end if;
end $$;

alter table public.posts drop column if exists tags;
alter table public.posts drop column if exists drive_file_id;
alter table public.posts drop column if exists cover_url;

-- Posts existentes quedan en draft (no tienen fuente en el repo todavia)
update public.posts set status = 'draft' where status <> 'draft';

-- Constraints de posts (agregadas al final, tras la migracion de datos)
alter table public.posts drop constraint if exists posts_series_pair_check;
alter table public.posts add constraint posts_series_pair_check
  check ((series_id is null) = (series_order is null));

alter table public.posts drop constraint if exists posts_status_published_check;
alter table public.posts add constraint posts_status_published_check
  check (status = 'draft' or published_at is not null);

alter table public.posts drop constraint if exists posts_series_order_unique;
alter table public.posts add constraint posts_series_order_unique
  unique (series_id, series_order);

alter table public.posts drop constraint if exists posts_slug_check;
alter table public.posts add constraint posts_slug_check
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public._set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public._set_updated_at();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.series enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.post_sources enable row level security;
alter table public.newsletter_sends enable row level security;
alter table public.newsletter_deliveries enable row level security;

drop policy if exists "public read series" on public.series;
create policy "public read series" on public.series
  for select using (true);

drop policy if exists "public read tags" on public.tags;
create policy "public read tags" on public.tags
  for select using (true);

drop policy if exists "public read post_tags" on public.post_tags;
create policy "public read post_tags" on public.post_tags
  for select using (
    exists (
      select 1 from public.posts p
      where p.id = post_tags.post_id and p.status = 'published'
    )
  );

drop policy if exists "public read post_sources" on public.post_sources;
create policy "public read post_sources" on public.post_sources
  for select using (
    exists (
      select 1 from public.posts p
      where p.id = post_sources.post_id and p.status = 'published'
    )
  );

-- (posts ya tiene su policy "public read published" desde 0001)

-- ---------------------------------------------------------------------
-- sync_post: upsert atomico de post + serie + tags + fuente
-- ---------------------------------------------------------------------
create or replace function public.sync_post(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_series_id uuid;
  v_post_id uuid;
  v_slug text;
  v_tag jsonb;
  v_tag_id uuid;
begin
  v_slug := p->>'slug';
  if v_slug is null or v_slug = '' then
    raise exception 'slug requerido';
  end if;

  -- upsert serie
  if p->'series' is not null and p->'series' <> 'null'::jsonb then
    insert into public.series (slug, title, description)
    values (
      p->'series'->>'slug',
      p->'series'->>'title',
      p->'series'->>'description'
    )
    on conflict (slug) do update
      set title = excluded.title,
          description = excluded.description
    returning id into v_series_id;
  else
    v_series_id := null;
  end if;

  -- upsert post por slug, conservando status/published_at si ya existe
  insert into public.posts (
    slug, title, summary, cover_path, reading_minutes,
    status, series_id, series_order
  )
  values (
    v_slug,
    p->>'title',
    p->>'summary',
    p->>'cover_path',
    coalesce((p->>'reading_minutes')::int, 1),
    'draft',
    v_series_id,
    case when p->>'series_order' is null then null else (p->>'series_order')::int end
  )
  on conflict (slug) do update
    set title = excluded.title,
        summary = excluded.summary,
        cover_path = excluded.cover_path,
        reading_minutes = excluded.reading_minutes,
        series_id = excluded.series_id,
        series_order = excluded.series_order
  returning id into v_post_id;

  -- reemplazar post_tags
  delete from public.post_tags where post_id = v_post_id;

  if p->'tags' is not null then
    for v_tag in select * from jsonb_array_elements(p->'tags') loop
      insert into public.tags (slug, name)
      values (v_tag->>'slug', v_tag->>'name')
      on conflict (slug) do update set name = excluded.name
      returning id into v_tag_id;

      insert into public.post_tags (post_id, tag_id)
      values (v_post_id, v_tag_id)
      on conflict do nothing;
    end loop;
  end if;

  -- upsert post_sources
  insert into public.post_sources (post_id, repo, path, commit_sha, synced_at)
  values (v_post_id, p->>'repo', p->>'path', p->>'commit_sha', now())
  on conflict (post_id) do update
    set repo = excluded.repo,
        path = excluded.path,
        commit_sha = excluded.commit_sha,
        synced_at = now();

  return v_post_id;
end;
$$;

revoke all on function public.sync_post(jsonb) from public;
revoke execute on function public.sync_post(jsonb) from public, anon, authenticated;
grant execute on function public.sync_post(jsonb) to service_role;

commit;
