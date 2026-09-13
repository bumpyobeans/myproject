-- ============================================================
-- 범표노트 - 글 댓글 (post comments)
-- ------------------------------------------------------------
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run
-- 이 파일은 다시 실행해도 안전합니다.
--
-- 참고: Authentication → Providers → Email 에서 'Confirm email'을
-- 꺼두면 가입 즉시 로그인됩니다(개인 블로그 규모면 꺼두는 걸 추천).
-- 켜져 있으면 가입 시 인증 메일을 클릭해야 로그인 가능합니다.
-- ============================================================

create table if not exists public.note_comments (
  id         uuid primary key default gen_random_uuid(),
  post_slug  text not null,
  name       text not null check (char_length(name) between 1 and 30),
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists note_comments_post_slug_created_at_idx
  on public.note_comments (post_slug, created_at);

-- 로그인한 사용자가 작성한 댓글에 사용자 id 연결 (비로그인이면 null)
alter table public.note_comments add column if not exists user_id uuid references auth.users(id);
alter table public.note_comments alter column user_id set default auth.uid();

-- 권한
alter table public.note_comments enable row level security;

drop policy if exists "anon insert note_comments" on public.note_comments;
drop policy if exists "anon select note_comments" on public.note_comments;
drop policy if exists "insert own or anon note_comments" on public.note_comments;
drop policy if exists "select note_comments" on public.note_comments;
drop policy if exists "delete own note_comments" on public.note_comments;

-- 비로그인은 user_id 없이만, 로그인 사용자는 자기 id로만 insert 가능
create policy "insert own or anon note_comments" on public.note_comments
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- 전체 공개 조회 (비로그인/로그인 모두)
create policy "select note_comments" on public.note_comments
  for select to anon, authenticated
  using (true);

-- 본인 댓글만 삭제 가능 (anon은 delete 정책이 없어서 절대 못 지움)
create policy "delete own note_comments" on public.note_comments
  for delete to authenticated
  using (auth.uid() = user_id);

-- 관리자 계정(bebebek1005@gmail.com)으로 로그인하면 스팸 등 아무 댓글이나 삭제 가능
drop policy if exists "admin delete any note_comments" on public.note_comments;
create policy "admin delete any note_comments" on public.note_comments
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'bebebek1005@gmail.com');

-- 수정 정책은 없음 → 브라우저에서는 고칠 수 없음 (대시보드에서만)
