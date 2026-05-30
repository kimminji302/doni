# 개발 요청서 #001 — 크로스 디바이스 동기화 불가 문제 해결

> 기획팀 작성 | 2026-05-30
> 우선순위: 🔴 Critical (앱 핵심 기능 불가)

---

## 문제 현상

- 사파리에서 구글 로그인 후 지출/수입 내역 저장 → 크롬에서 구글 로그인 시 데이터 없음
- 모바일에서 저장한 내역 → PC에서 보이지 않음
- 같은 구글 계정으로 로그인해도 기기마다 데이터가 따로 놀음

---

## 원인 분석 (코드 확인 결과)

현재 코드 상태를 분석한 결과, **구글 로그인과 Supabase가 전혀 연동되어 있지 않음**.

### 현재 실제 구조

```
[구글 로그인 버튼] 클릭
        ↓
localStorage에 "doni_logged" = "1" 저장
        ↓
로그인 된 척 화면 전환 (실제 구글 인증 없음)
```

```
[지출/수입 저장]
        ↓
localStorage에만 저장 (브라우저 로컬)
        ↓
Supabase DB 저장 없음
```

### 저장 키 현황
| 키 | 내용 |
|----|------|
| `doni_logged` | 로그인 여부 플래그 (가짜) |
| `doni_exp_v3` | 지출 내역 (로컬만) |
| `doni_set_v3` | 월별 수입/고정비 설정 (로컬만) |
| `doni_plan_v3` | 구매 계획 (로컬만) |

**결론: 구글 로그인은 UI만 있고 실제 인증이 없음. 데이터는 브라우저 로컬에만 저장됨.**

---

## 요청 작업

### 작업 1. 구글 로그인 실제 연동
- Supabase Auth + Google OAuth 실제 연결
- 로그인 성공 시 `user.id` (Supabase user UUID) 확보
- 로그아웃 시 Supabase signOut 처리

**Supabase 정보**
```
Project URL: https://kuilgkjslbsovzapkxva.supabase.co
Publishable key: sb_publishable__Gv6gzSfRFkQBueNyWX_mA_hVoJOeVb
```

---

### 작업 2. Supabase DB 테이블 생성

아래 SQL을 Supabase SQL Editor에서 실행:

```sql
-- 지출 내역
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  year int not null,
  month int not null,
  full_date date,
  item text not null,
  cost int not null,
  tag text,
  category text,
  custom_hash text,
  created_at timestamptz default now()
);
alter table expenses enable row level security;
create policy "본인 데이터만" on expenses
  for all using (auth.uid() = user_id);

-- 월별 설정
create table monthly_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  year int not null,
  month int not null,
  inc_total int default 0,
  fix_total int default 0,
  inc_details jsonb default '[]',
  fix_details jsonb default '[]',
  goal text,
  updated_at timestamptz default now(),
  unique (user_id, year, month)
);
alter table monthly_settings enable row level security;
create policy "본인 데이터만" on monthly_settings
  for all using (auth.uid() = user_id);

-- 구매 계획
create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  year int not null,
  month int not null,
  item text not null,
  cost int not null,
  reason text,
  status text default 'thinking',
  satisfaction int,
  created_at timestamptz default now()
);
alter table plans enable row level security;
create policy "본인 데이터만" on plans
  for all using (auth.uid() = user_id);
```

---

### 작업 3. 데이터 저장/불러오기 Supabase로 교체

| 현재 | 변경 후 |
|------|---------|
| `localStorage.setItem('doni_exp_v3', ...)` | `supabase.from('expenses').upsert(...)` |
| `localStorage.setItem('doni_set_v3', ...)` | `supabase.from('monthly_settings').upsert(...)` |
| `localStorage.setItem('doni_plan_v3', ...)` | `supabase.from('plans').upsert(...)` |
| `localStorage.getItem('doni_exp_v3')` | `supabase.from('expenses').select(*)` |

---

### 작업 4. 비로그인 게스트 모드 유지

- 로그인 안 한 상태 → 기존처럼 localStorage 사용 (그대로 유지)
- 로그인 한 상태 → Supabase 사용
- 게스트 → 로그인 전환 시 기존 localStorage 데이터를 Supabase로 1회 마이그레이션

---

## 완료 기준

- [ ] 모바일 크롬에서 지출 저장 → PC 사파리에서 같은 구글 계정으로 로그인 시 동일 데이터 보임
- [ ] 로그아웃 후 재로그인 해도 데이터 유지
- [ ] 기기 3개에서 같은 계정 로그인 시 동일 데이터 동기화
