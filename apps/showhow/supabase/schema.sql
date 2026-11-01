-- Showhow schema. Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- Anonymous visitors can read published guides only; every write goes through /api with the server key.

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  category text not null check (char_length(category) between 1 and 40),
  creator_name text not null check (char_length(creator_name) between 1 and 60),
  status text not null default 'draft' check (status in ('draft', 'processing', 'ready', 'published', 'failed')),
  kind text not null default 'video' check (kind in ('video', 'voice')),
  image_style text,
  subject text,       -- voice guides: visual description of the object, from the safety review (base illustration)
  auto_title boolean not null default false,    -- creator left the title blank: the review's title replaces it (F6)
  auto_category boolean not null default false, -- creator chose "Let AI choose" (F5)
  frames_ok boolean not null default false,     -- video guides: keyframes passed the content review (F4); publish requires it
  attempts int not null default 0, -- model-stage runs; routes refuse after 3 (credit guard)
  claimed_at timestamptz, -- when the current stage started; a 'processing' claim older than 330 s can be taken over
  turns jsonb,        -- Voice Transcribe turns, kept so a retry skips re-transcribing (narration becomes step text anyway)
  video_path text,
  duration_s real,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.steps (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides (id) on delete cascade,
  idx int not null check (idx >= 0),
  title text not null,
  instruction text not null,
  tip_quote text,
  start_s real not null check (start_s >= 0),
  end_s real not null,
  key_part text not null,
  sam_noun text,
  keyframe_path text,
  outline jsonb,      -- {frameW, frameH, box:[x,y,w,h], score} from SAM, or null
  audio_path text,    -- Wit.ai read-aloud MP3 (stretch)
  image_path text,    -- AI image (labelled): voice illustration or T18 enhanced frame; highlight = same path with -focus
  unique (guide_id, idx),
  check (end_s > start_s)
);

-- Columns added after the first apply (2026-10-31): keep the script re-runnable on existing tables.
alter table public.guides add column if not exists kind text not null default 'video' check (kind in ('video', 'voice'));
alter table public.guides add column if not exists image_style text;
alter table public.guides add column if not exists attempts int not null default 0;
alter table public.guides add column if not exists turns jsonb;
alter table public.guides add column if not exists subject text;
alter table public.guides add column if not exists claimed_at timestamptz;
alter table public.guides add column if not exists auto_title boolean not null default false;
alter table public.guides add column if not exists auto_category boolean not null default false;
alter table public.guides add column if not exists frames_ok boolean not null default false;
alter table public.steps add column if not exists image_path text;

-- Daily counters for spend/abuse caps. No policies: invisible to the public.
create table if not exists public.usage (
  day date not null default current_date,
  kind text not null,
  count int not null default 0,
  primary key (day, kind)
);

alter table public.guides enable row level security;
alter table public.steps enable row level security;
alter table public.usage enable row level security;

drop policy if exists "published guides are public" on public.guides;
create policy "published guides are public" on public.guides
  for select to anon, authenticated using (status = 'published');

drop policy if exists "steps of published guides are public" on public.steps;
create policy "steps of published guides are public" on public.steps
  for select to anon, authenticated
  using (exists (select 1 from public.guides g where g.id = guide_id and g.status = 'published'));

-- Atomic "count this and say whether we're still under the limit". Server key only.
create or replace function public.bump_usage(p_kind text, p_limit int) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.usage (day, kind, count) values (current_date, p_kind, 1)
  on conflict (day, kind) do update set count = public.usage.count + 1
  returning count into n;
  return n <= p_limit;
end $$;
revoke execute on function public.bump_usage(text, int) from public, anon, authenticated;

-- One public bucket: <guide-id>/video.mp4, audio.wav (deleted after transcription), <idx>.jpg (real keyframe),
-- <idx>-ai.jpg + <idx>-ai-focus.jpg (AI images, labelled), <idx>.mp3 (read-aloud).
-- Public read so Muse Spark can fetch video_url and the viewer can stream. No upload policy:
-- uploads only via signed URLs that /api creates with the server key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 50 * 1024 * 1024, array['video/mp4', 'audio/wav', 'image/jpeg', 'audio/mpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Duplicate hints (F7): published guides in the same category with a similar title. Server key only.
create extension if not exists pg_trgm with schema extensions;
create or replace function public.similar_guides(p_title text, p_category text, p_exclude uuid)
returns table (id uuid, title text, creator_name text, sim real)
language sql stable security definer set search_path = public, extensions as $$
  select g.id, g.title, g.creator_name, similarity(g.title, p_title) as sim
  from public.guides g
  where g.status = 'published' and g.category = p_category and g.id <> p_exclude
    and similarity(g.title, p_title) > 0.15
  order by sim desc
  limit 3
$$;
revoke execute on function public.similar_guides(text, text, uuid) from public, anon, authenticated;
