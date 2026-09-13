-- ============================================================
-- 범표노트 - 협업 문의 (contact/inquiries)
-- ------------------------------------------------------------
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run
-- 이 파일은 다시 실행해도 안전합니다.
--
-- 이 표는 "쓰기만" 허용됩니다 (sessions/events 표와 같은 방식).
-- 즉 누구나 문의는 남길 수 있지만, 그 누구도(방문자·다른 사람) 문의
-- 내용을 웹에서 읽을 수는 없습니다. 확인은 반드시 아래에서만:
-- 대시보드 → Table Editor → inquiries
-- ============================================================

create table if not exists public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 50),
  contact    text,
  email      text not null check (char_length(email) between 3 and 100),
  company    text,
  type       text not null,
  message    text not null check (char_length(message) between 1 and 3000),
  created_at timestamptz not null default now()
);

alter table public.inquiries enable row level security;

drop policy if exists "anon insert inquiries" on public.inquiries;

create policy "anon insert inquiries" on public.inquiries
  for insert to anon
  with check (true);

-- select/update/delete 정책 없음 → 대시보드(관리자) 말고는 아무도 못 읽음
