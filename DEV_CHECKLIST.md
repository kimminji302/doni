# doni 앱 개발 체크리스트

> 기획팀 확정 기준 | 최종 업데이트: 2026-05-30

---

## Phase 1. 기반 작업 (Supabase + 구글 로그인)

- [ ] Supabase 프로젝트 생성 (supabase.com)
- [ ] Supabase `expenses` 테이블 생성
- [ ] Supabase `monthly_settings` 테이블 생성
- [ ] RLS(Row Level Security) 정책 설정 — 본인 데이터만 접근 가능
- [ ] Google OAuth Provider 설정 (Supabase Auth)
- [ ] index.html에 Supabase JS SDK 삽입
- [ ] 구글 로그인 UI 연동 (현재 버튼 → 실제 동작)
- [ ] localStorage → Supabase DB 마이그레이션 로직 구현
- [ ] 로그인 상태에 따른 화면 분기 처리 (비로그인 게스트 모드 유지 여부 결정 필요)

---

## Phase 2. UI/카피 타깃팅

- [ ] 타깃: 3040 직장인 여성으로 카피 및 톤앤매너 수정
- [ ] 인트로 화면 문구 수정
- [ ] 캐릭터 반응 메시지 3040 감성으로 조정
- [ ] 전반적인 UX 흐름 재검토 (진입장벽 최소화)

---

## Phase 3. 광고 연동

- [ ] 광고 플랫폼 계정 개설 (Applovin 또는 AdMob, 동생 명의)
- [ ] 전면 광고(Interstitial) 삽입 — 화면 전환 시점, 미리 로드 방식
- [ ] 네이티브 광고 삽입 — 지출 내역 리스트 사이
- [ ] 광고 미리 로드 로직 구현 (버튼 클릭 시점 아닌 진입 시점에 로드)

---

## Phase 4. 재방문 트리거

- [ ] 월말 편지 기능 구현 (돈이 캐릭터가 한 달 소비 감성 요약)
- [ ] 15일 중간 체크 푸시 알림 구현 (Web Push API 또는 네이티브)
- [ ] 푸시 알림 수신 동의 UX 설계

---

## Phase 5. 수익화

- [ ] 구독 모델 설계 (DAU 2,000~3,000 달성 이후 도입)
- [ ] 구독 전환 가치 정의 — 광고 제거가 아니라 새 기능 제공
- [ ] 스토어 등록 (안드로이드 우선, 동생 명의)
- [ ] 앱 아이콘 / 스크린샷 / 기능 그래픽 제작

---

## 환경 정보 (개발팀 참고)

| 항목 | 내용 |
|------|------|
| 서버 | 오라클 클라우드 (ubuntu@minjicolor2) |
| 서비스 경로 | `/home/ubuntu/doni/` |
| 프로세스 관리 | PM2, port 3001 |
| 배포 방법 | GitHub push → 서버에서 `git pull` → `pm2 reload doni` |
| 코드 저장소 | github.com/kimminji302/doni |
| 현재 DB | localStorage (브라우저) → Supabase로 이전 예정 |
| 수익 명의 | 동생 사업자 명의로 진행 |

---

## 참고 문서

| 문서 | 내용 |
|------|------|
| `PLAN_v2.md` | 전체 기획 방향, 수익 모델, Supabase 데이터 모델 |
| `MVP기획서_최종.md` | 화면별 기능 요구사항, 데이터 모델, QA 기준 |
| `프로젝트_의도_분석_기획서.md` | 프로젝트 의도, UX 구조, 톤앤매너 |
| `DOT4meetUP_notes.md` | 에이전트 개발, 솔로프리너 수익화 참고 자료 |
