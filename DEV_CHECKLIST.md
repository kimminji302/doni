# 돈이 개발 체크리스트

## Phase 1: Supabase 연동 + 인증

### 1-1. Supabase + 구글 로그인 연동
- [x] Supabase JS SDK CDN 추가
- [x] 로그인 오버레이 UI (Google 로그인 버튼)
- [x] 인증 상태에 따른 앱 표시/숨김 처리
- [x] `window.signOut()` 함수 노출
- [ ] Supabase Dashboard - Google OAuth 제공자 활성화 (수동 작업 필요)
- [ ] Google Cloud Console - OAuth 클라이언트 ID 생성 및 리디렉션 URL 등록 (수동 작업 필요)

### 1-2. Supabase DB 스키마 생성
- [ ] `expenses` 테이블 (기존 Expense 엔티티)
- [ ] `monthly_settings` 테이블 (기존 MonthlySetting 엔티티)
- [ ] RLS(Row Level Security) 정책 설정 (user_id 기반)

### 1-3. localStorage → Supabase DB 이전
- [ ] 기존 localStorage 데이터 읽기
- [ ] Supabase에 마이그레이션 로직 구현
- [ ] 앱 내 CRUD를 localStorage → Supabase API로 교체

---

## Phase 2: 데이터 동기화 & UX 개선

### 2-1. 실시간 동기화
- [ ] Supabase Realtime 구독

### 2-2. 다기기 지원
- [ ] 로그인 후 기존 데이터 자동 로드

---

## 수동 설정 가이드 (개발자 작업)

### Supabase Google OAuth 설정
1. Supabase Dashboard → Authentication → Providers → Google 활성화
2. Google Cloud Console → API & Services → OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI: `https://kuilgkjslbsovzapkxva.supabase.co/auth/v1/callback`
4. 클라이언트 ID / 시크릿을 Supabase Google Provider에 입력
5. Supabase Dashboard → Authentication → URL Configuration → Site URL: 서버 도메인 입력
6. Redirect URLs에 서버 도메인 추가
