alter table public.captured_media
  add column if not exists caption text,
  add constraint captured_media_caption_length check (caption is null or char_length(caption) <= 180);

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel
    join pg_class on pg_class.oid = pg_publication_rel.prrelid
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    join pg_publication on pg_publication.oid = pg_publication_rel.prpubid
    where pg_publication.pubname = 'supabase_realtime'
      and pg_namespace.nspname = 'public'
      and pg_class.relname = 'captured_media'
  ) then
    alter publication supabase_realtime add table public.captured_media;
  end if;
end $$;
