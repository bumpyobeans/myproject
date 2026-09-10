-- ============================================================
-- 범표원두 커피 추천 - 상담 기록 저장용 표 (Supabase)
-- ------------------------------------------------------------
-- 실행 방법: Supabase 대시보드 → 왼쪽 SQL Editor → New query →
--            이 파일 내용 전체 붙여넣기 → Run
-- 다시 실행해도 안전합니다 (있으면 건너뜀).
--
-- 개인정보는 저장하지 않습니다. visitor_id 는 브라우저가 스스로 만든
-- 무작위 값이라 사람을 특정할 수 없습니다.
-- ============================================================

-- 1) 방문(세션) 1건 = 상담 한 번 시작
create table if not exists public.sessions (
  id          uuid primary key,                       -- 브라우저가 만들어 보냄
  created_at  timestamptz not null default now(),
  visitor_id  text not null,                          -- 같은 브라우저면 같은 값 (재도전 묶기)
  src         text,                                   -- 유입 경로: kakao / store / insta / friend / 직접입력
  from_type   text,                                   -- 친구 공유 링크에 실린 친구 유형 (2단계용, 지금은 비어 있음)
  referrer    text,                                   -- 이전 페이지 주소 (브라우저가 알려주는 값)
  device      text,                                   -- mobile / pc
  user_agent  text,
  landing_url text                                    -- 처음 열린 주소 (파라미터 포함)
);

-- 2) 행동(이벤트) 1건
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  session_id  uuid not null,
  visitor_id  text not null,
  type        text not null,                          -- start / answer / result / shop_click / share / restart / chip
  payload     jsonb not null default '{}'::jsonb      -- 답변·상품번호·위치 등 (아래 참고)
);

-- payload 예시
--   answer     : {"q":"q1","value":"라떼"}
--   result     : {"answers":{...}, "chosen":"5188817159", "new":"7144276521", "sample":"9942645030", "fallback":false}
--   shop_click : {"product_id":"5188817159","name":"범표라떼 350ml 5캔","position":"main"}   -- main / new / sample
--   share      : {"method":"share"|"clipboard"|"text", "ok":true}
--   restart    : {}
--   chip       : {"product_id":"5215355668","flavor":"디카페인호랑이"}

create index if not exists events_session_idx on public.events (session_id);
create index if not exists events_type_time_idx on public.events (type, created_at);
create index if not exists sessions_visitor_idx on public.sessions (visitor_id);
create index if not exists sessions_src_idx on public.sessions (src);
create index if not exists sessions_time_idx on public.sessions (created_at);

-- 3) 권한: 브라우저(익명 키)는 "쓰기만" 가능. 읽기·수정·삭제는 대시보드에서만.
alter table public.sessions enable row level security;
alter table public.events  enable row level security;

drop policy if exists "anon insert sessions" on public.sessions;
drop policy if exists "anon insert events"  on public.events;

create policy "anon insert sessions" on public.sessions
  for insert to anon with check (true);

create policy "anon insert events" on public.events
  for insert to anon with check (true);

-- 확인용 (실행 후 아래 두 줄이 각각 0 이면 정상 — 아직 기록이 없으니)
-- select count(*) from public.sessions;
-- select count(*) from public.events;
