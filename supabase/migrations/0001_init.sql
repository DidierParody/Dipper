create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  content_md text not null,
  cover_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists posts_published_idx on public.posts (status, published_at desc);

alter table public.posts enable row level security;

drop policy if exists "public read published" on public.posts;
create policy "public read published" on public.posts
  for select using (status = 'published');

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text not null,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

alter table public.subscribers enable row level security;
-- Sin policies: solo service_role (Edge Functions) accede a subscribers.

insert into storage.buckets (id, name, public)
values ('post-assets', 'post-assets', true)
on conflict (id) do nothing;
