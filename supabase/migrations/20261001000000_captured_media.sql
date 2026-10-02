create table if not exists public.captured_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  media_kind text not null check (media_kind in ('photo', 'video')),
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  captured_at timestamptz not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists captured_media_user_capture_idx
  on public.captured_media (user_id, captured_at desc, uploaded_at desc);

insert into storage.buckets (id, name, public, file_size_limit)
values ('memories', 'memories', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800;

alter table public.captured_media enable row level security;

drop policy if exists "Users can view their captured media" on public.captured_media;
create policy "Users can view their captured media"
  on public.captured_media for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can add their captured media" on public.captured_media;
create policy "Users can add their captured media"
  on public.captured_media for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and storage_path like (select auth.uid())::text || '/%'
  );

drop policy if exists "Users can delete their captured media" on public.captured_media;
create policy "Users can delete their captured media"
  on public.captured_media for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can view their memory objects" on storage.objects;
create policy "Users can view their memory objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can upload their memory objects" on storage.objects;
create policy "Users can upload their memory objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their memory objects" on storage.objects;
create policy "Users can delete their memory objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
