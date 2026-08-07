-- law-check 공유 DB 설정
-- Supabase SQL Editor에서 실행하세요

-- 1. Q&A 사례 테이블
create table if not exists qa_records (
  id bigint generated always as identity primary key,
  category text not null,
  question text not null,
  answer text not null,
  tags text[],
  created_by text,
  is_verified boolean default false,
  created_at timestamptz default now()
);

-- 전체 텍스트 검색 인덱스
create index if not exists qa_records_question_fts
  on qa_records using gin(to_tsvector('simple', question));

-- 2. 방송심의 사례 테이블
create table if not exists broadcast_cases (
  id bigint generated always as identity primary key,
  program text not null,
  violation text not null,
  regulation text not null,
  decision text not null,
  source text default 'user',
  created_at timestamptz default now()
);

-- 3. 공개 읽기/쓰기 허용 (anon key로 접근)
alter table qa_records enable row level security;
alter table broadcast_cases enable row level security;

create policy "anyone can read qa_records"
  on qa_records for select using (true);

create policy "anyone can insert qa_records"
  on qa_records for insert with check (true);

create policy "anyone can read broadcast_cases"
  on broadcast_cases for select using (true);

create policy "anyone can insert broadcast_cases"
  on broadcast_cases for insert with check (true);
