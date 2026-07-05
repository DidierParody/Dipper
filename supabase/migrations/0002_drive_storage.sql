alter table public.posts add column if not exists drive_file_id text;
alter table public.posts add column if not exists reading_minutes int not null default 1;
alter table public.posts drop column if exists content_md;
-- tabla prácticamente vacía (solo el draft de prueba "Hola desde Drive", que ya
-- existe en Drive con file id 1NmPJsPtNdV8wr0TXJDdPxWam_nJe0IrE) — backfill manual:
update public.posts set drive_file_id = '1NmPJsPtNdV8wr0TXJDdPxWam_nJe0IrE'
  where slug = 'hola-desde-drive' and drive_file_id is null;
delete from public.posts where drive_file_id is null; -- huérfanos sin contenido
