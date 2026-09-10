-- ============================================================
-- 범표원두 커피 추천 - "내 커피 친구 지도" 표 (3단계)
-- ------------------------------------------------------------
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query → 전체 붙여넣기 → Run
-- 다시 실행해도 안전합니다.
--
-- sessions/events 는 "쓰기만" 이지만, 지도 2개 표는 "쓰기 + 읽기"를 엽니다.
-- 지도 코드(id)는 브라우저가 만든 무작위 10자라, 코드를 아는 사람만 그 지도를
-- 볼 수 있습니다(비공개 링크 방식). 저장되는 건 유형·궁합·선택한 별명뿐입니다.
-- ============================================================

-- 1) 지도 (링크를 뿌린 사람 = 주인)
create table if not exists public.maps (
  id            text primary key,                    -- 무작위 10자 코드 (브라우저 생성)
  created_at    timestamptz not null default now(),
  owner_visitor text not null,                       -- 주인의 방문자번호
  owner_type    text not null,                       -- 주인의 호랑이 유형
  owner_name    text                                 -- 별명 (선택, 12자 이내)
);

-- 2) 지도에 올라온 친구
create table if not exists public.map_friends (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  map_id         text not null,
  friend_visitor text not null,                      -- 친구의 방문자번호 (같은 지도에 한 번만)
  friend_type    text not null,                      -- 친구의 호랑이 유형
  friend_name    text,                               -- 별명 (선택)
  pair_name      text,                               -- 궁합 이름
  pair_score     int                                 -- 궁합 점수
);

create index if not exists map_friends_map_idx on public.map_friends (map_id);
create unique index if not exists map_friends_once on public.map_friends (map_id, friend_visitor);

-- 3) 권한
alter table public.maps        enable row level security;
alter table public.map_friends enable row level security;

drop policy if exists "anon insert maps"        on public.maps;
drop policy if exists "anon select maps"        on public.maps;
drop policy if exists "anon insert map_friends" on public.map_friends;
drop policy if exists "anon select map_friends" on public.map_friends;

create policy "anon insert maps"        on public.maps        for insert to anon with check (true);
create policy "anon select maps"        on public.maps        for select to anon using (true);
create policy "anon insert map_friends" on public.map_friends for insert to anon with check (true);
create policy "anon select map_friends" on public.map_friends for select to anon using (true);

-- 수정·삭제 정책은 없음 → 브라우저에서는 고칠 수도 지울 수도 없음 (대시보드에서만)
