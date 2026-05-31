# Supabase 설정 가이드

> Supabase 재설정 또는 신규 프로젝트 생성 시 참고

---

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트 이름 | doni |
| 계정 | minjicolor@gmail.com |
| Project URL | https://kuilgkjslbsovzapkxva.supabase.co |
| Anon Key | index.html 내 SUPA_KEY 변수 참고 |

---

## 데이터베이스 테이블

### user_data 테이블 (전체 데이터 저장)

```sql
create table user_data (
  user_id uuid primary key references auth.users not null,
  expenses jsonb default '[]',
  settings jsonb default '{}',
  plans    jsonb default '[]',
  updated_at timestamptz default now()
);

alter table user_data enable row level security;

create policy "본인 데이터만" on user_data
  for all using (auth.uid() = user_id);

grant all on user_data to authenticated;
```

### 데이터 구조

**expenses** (`doni_exp_v3`)
```json
[
  {
    "id": "1748543210000",
    "year": 2026,
    "month": 5,
    "fullDate": "2026-05-01",
    "time": "",
    "item": "커피",
    "cost": 5000,
    "tag": "식비",
    "customHash": "",
    "category": "행복"
  }
]
```

**settings** (`doni_set_v3`)
```json
{
  "2026-5": {
    "inc": 3000000,
    "fix": 800000,
    "incDetails": [{"id": "1", "name": "월급", "amount": 3000000}],
    "fixDetails": [{"id": "2", "name": "월세", "amount": 500000}],
    "goal": "저축 100만원"
  }
}
```

**plans** (`doni_plan_v3`)
```json
[
  {
    "id": "1748543210000",
    "item": "에어팟",
    "cost": 200000,
    "reason": "운동할 때 필요",
    "status": "thinking",
    "satisfaction": null,
    "createdAt": 1748543210000
  }
]
```

---

## Google OAuth 설정

### Supabase Auth 설정

1. Supabase 대시보드 → Authentication → Providers → Google 활성화
2. Google Cloud Console에서 OAuth 클라이언트 ID/Secret 발급
3. Supabase에 Client ID, Client Secret 입력
4. Authorized redirect URI:
   ```
   https://kuilgkjslbsovzapkxva.supabase.co/auth/v1/callback
   ```

### Google Cloud Console 설정

- 프로젝트: doni
- OAuth 동의 화면: 외부 사용자
- Authorized JavaScript origins:
  ```
  http://168.107.15.55:3001
  https://doniapp.kr
  ```
- Authorized redirect URIs:
  ```
  https://kuilgkjslbsovzapkxva.supabase.co/auth/v1/callback
  ```

---

## RLS (Row Level Security) 정책

모든 테이블에 동일하게 적용:
- 본인의 `user_id`와 `auth.uid()`가 일치하는 데이터만 접근 가능
- 로그인하지 않으면 데이터 접근 불가

---

## 앱 연동 방식

```
localStorage.setItem 호출
  → dbSave() 실행
  → user_data 테이블 update (해당 컬럼만)

로그인 시
  → migrateIfNeeded() — 최초 1회 로컬 데이터 → Supabase 마이그레이션
  → dbLoad() — Supabase → localStorage 로드
  → location.reload() — Vue가 최신 데이터로 초기화
```
