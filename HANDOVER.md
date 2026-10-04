# 도니(Doni) 개발 인수인계 문서

> 최종 업데이트: 2026-10-04
> 작업 브랜치: `claude/ecstatic-brahmagupta-igEub`
> 저장소: `kimminji302/doni`

이 문서 하나로 도니앱 개발을 이어받을 수 있도록 정리한 인수인계서입니다.

---

## 0. 가장 먼저 읽을 것 (중요)

- 이 앱은 **단일 `index.html`** 안에 전부 들어있는 **Vue 3 기반 PWA**입니다. 별도 빌드 과정이 없습니다. 파일을 고치고 서버에 `git pull`하면 끝.
- `index.html`은 두 부분으로 나뉩니다:
  - **(A) 미니파이된 Vue 번들** — 원본 소스가 없고 사람이 읽기 어려운 압축 코드. **직접 수정 금지.**
  - **(B) 커스텀 주입(injection) 코드** — `<script>` 안에 우리가 직접 작성/유지보수하는 부분. **기능 수정은 거의 전부 여기서** 합니다.
- 동작 원리: (B)가 `MutationObserver`로 DOM을 감시하다가, Vue가 특정 화면/요소를 그리면 그 위에 우리 UI(진행바, 채팅 입력, 설정 버튼 등)를 **주입**합니다.
- **`DEV_CHECKLIST.md`는 구버전이라 폐기 상태입니다.** (구글 로그인 + Supabase 마이그레이션을 전제로 쓰였는데, 지금은 로그인을 완전히 제거했습니다. 내용이 현재와 반대이니 무시하세요.)

---

## 1. 앱 개요

돈을 **'돈이'라는 친구 캐릭터**로 의인화한 감성 가계부.

- 소비를 금액이 아니라 **감정 4종**으로 기록: 성장(growth) / 행복(joy) / 든든(living) / 방황(waste).
- 잘 쓴 소비는 돈이가 **칭찬**("행복한 소비잖아, 그걸로 충분해!"). 혼내지 않고 응원하며 습관을 바꾸는 게 목표.
- **6개월 연속 목표 달성 시 '졸업장'** 발급(습관 교정의 결승선).
- 자연어 한 문장으로 기록("떡볶이 5천원 행복했어").
- 슬로건: "날 가치 있는 곳에 써주면 더 좋은 일로 되돌아올 거야".
- 도메인: **doniapp.kr**

탭 구성: **홈 · 썼어요(채팅 기록) · 돌아보기(소비 심리 분석) · 살까말까(충동구매 방지) · 설정**

---

## 2. 현재 상태 (최근 큰 변경, 최신순)

| 커밋 | 내용 |
|---|---|
| `7b43241` | 푸시 토글 버그 수정 — `window.subscribePush` 노출(스코프 오류 해결) |
| `3ad3f92` | **로그인 완전 제거 / 로컬 전용** — 구글 로그인·Supabase 유저 삭제, 개인정보 수집 0, 푸시 익명화 |
| `5f9a420` | **다크모드 라인아트 규칙 통일** — 배경 없이 `filter:invert(1)`, 따뜻한 다크 팔레트 |

핵심 방향: **사업자등록 없이 운영** + **"그날의 성찰" 컨셉**(평생 보관 아님) → 그래서 로그인/계정/클라우드 동기화를 의도적으로 없앴습니다. 지출 데이터는 기기 localStorage에만 저장합니다.

---

## 3. 저장소 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 앱 전체(약 1,672줄). Vue 번들 + 커스텀 주입 코드 |
| `push-sender.js` | 서버 크론용 Node 스크립트. 매일 8:30 모든 구독에 web-push 발송. 개인화 없음(범용 문구 랜덤) |
| `sw.js` | 서비스워커. 푸시 수신(payload의 title/body만 표시) + 오프라인 캐시 |
| `manifest.json` | PWA 매니페스트 |
| `doni.gif` | 돈이 캐릭터(흑백 라인 아트, 투명 배경) |
| `icon-192.png` `icon-512.png` `favicon.png` `badge.png` `home.png` `th_01.jpg` | 아이콘/이미지 자산 |
| `DEPLOY.md` | 배포 방법(최신, 유효) |
| `MVP기획서_최종.md` `프로젝트_의도_분석_기획서.md` | 기획 배경(참고용) |
| `DEV_CHECKLIST.md` | ⚠️ **구버전, 폐기** |
| `WORKFLOW.md` | 작업 루틴 메모 |

---

## 4. 아키텍처 핵심

### 구동 흐름
1. `index.html` 로드 → 커스텀 IIFE 실행
2. `showApp()`이 **즉시** 앱 표시 (로그인 화면 없음, Supabase 로딩과 무관)
3. `initSupabase()`가 비동기로 로드되어 **푸시 구독만** 등록

### 데이터 저장 — localStorage가 원본(single source of truth)
| 키 | 형태 |
|---|---|
| `doni_exp_v3` | 지출 배열 `[{id, year, month, fullDate, item, cost, tag, category, customHash}]` |
| `doni_set_v3` | 월별 설정 `{ "YYYY-M": { goalAmount } }` |
| `doni_plan_v3` | 살까말까 계획 배열 `[{id, item, cost, tag, reason, doniReply, status}]` |
| `doni_score_v1` | 점수/졸업 상태 `{streak, totalSuccess, history, graduated, graduatedAt, graduateCount}` |
| `doni_start_month` | 6개월 현황 시작월 |
| `doni_device_id` | 익명 기기 id(푸시용, `crypto.randomUUID`) |

### Supabase (지금은 푸시 전용)
- 테이블 `push_subscriptions(user_id, subscription)` 하나만 사용. 여기서 `user_id`는 **익명 device_id**(실명 아님).
- URL / anon(publishable) key는 `index.html` 289-290줄에 하드코딩(공개용 키라 노출 OK).
- **지출/설정/계획은 더 이상 Supabase에 저장하지 않습니다.**

### 감정 태그
- `growth`(성장) / `joy`(행복) / `living`(든든) / `waste`(방황). 각 커스텀 GIF 이모지는 번들 내 data URI.
- waste 하위 '이유': 스트레스 / 충동 / 심심해서 / 그냥 / **예상 못 한 일**(억울한 지출은 자책 통계에서 제외하고 위로만).

---

## 5. 핵심 함수 위치 (`index.html`, 줄번호는 근사치)

| 함수/블록 | 줄 | 역할 |
|---|---|---|
| `getDeviceId()` | ~300 | 익명 기기 id 발급/조회 |
| `initSupabase()` | ~312 | Supabase 클라이언트 생성 + 푸시 등록 |
| `VAPID_PUBLIC_KEY` | ~433 | 웹푸시 공개키 |
| `requestPushPermission()` | ~435 | 푸시 권한 요청 (window 노출) |
| `subscribePush()` | ~449 | 푸시 구독 + push_subscriptions 저장 (window 노출) |
| `checkMonthlyResult()` | ~555 | 월말 목표 달성 판정(졸업 로직 관련) |
| `injectHomeProgress()` | ~735 | 홈 진행바/잔액 주입 |
| `injectChatHeader()` | ~801 | 채팅 헤더(돈이) 주입 |
| `injectSettingButtons()` | ~835 | 설정탭(목표/졸업/알림토글/초기화/안내문구) 주입 |
| `parseExpenseText()` | ~1133 | 자연어 파싱(금액/항목/감정/날짜/카테고리) |
| `saveExpense()` | ~1240 | localStorage 저장 + Vue store에 push |
| `injectNLButton()` | ~1275 | 채팅형 자연어 입력 UI |
| `injectUserBubble()` | ~1350 | 내 말풍선 주입 |
| `injectDoniBubble()` | ~1360 | 돈이 응답 말풍선 |
| `finishSave(wasteReason)` | ~1413 | 저장 마무리 + 격려 |
| `injectEncouragement()` | ~1453 | 돈이 칭찬/위로 멘트 |
| `showApp()` | ~1640 | 앱 즉시 표시(로그인 없음) |
| 다크모드 CSS | ~153–216 | `[data-theme="dark"]` 블록. 라인아트 규칙은 ~171–181 |

---

## 6. 배포 (DEPLOY.md 참고)

- **서버**: Oracle Always Free (doni-server)
  ```bash
  ssh -i ~/Downloads/ssh-key-2026-07-02.key ubuntu@152.67.197.229
  ```
- **배포**: 서버에서
  ```bash
  cd ~/doni && git pull origin claude/ecstatic-brahmagupta-igEub
  ```
- `pm2 serve`로 정적 서빙 → **git pull만 하면 반영**(재시작 불필요). 확인: `pm2 list`
- **푸시 크론**: 저녁 8:30. 확인: `crontab -l`. push-sender.js는 크론이 매번 새로 실행.
- **push-sender.js 환경변수**(서버 `~/.push-env` 등에 보관, GitHub에 올리지 않음):
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_KEY`
- SSH 키 파일(.key/.pem)은 **절대 저장소에 올리지 않습니다.**

---

## 7. 주의사항 / 함정

- **미니파이 Vue 번들을 직접 수정하지 마세요.** 원본 소스가 없고 scoped 클래스(`data-v-...`)라 쉽게 깨집니다. UI 변경은 주입 코드 + MutationObserver 패턴으로.
- 주입하는 채팅 버블은 Vue 네이티브 구조(`.msg-row.doni/.me`, `.bubble`, `data-v-907a7368`)를 **복제**해 scoped CSS를 그대로 받게 합니다.
- **푸시가 안 올 때**: Supabase `push_subscriptions`가 **익명(anon) insert를 허용하는지(RLS)** 먼저 확인. 로그인 제거 후 anon 쓰기가 막히면 구독 저장이 실패해 8:30 알림이 안 옵니다(앱 자체는 정상 동작).
- 날짜는 로컬 포매팅 사용(`toISOString`의 UTC 하루 밀림 버그 주의 — 이미 수정됨).
- 사용자 입력을 innerHTML에 넣는 곳은 `esc()`로 이스케이프(XSS 방지).
- index.html의 `<script>` 블록만 추출해 `node --check`로 문법 검증하는 걸 권장(아래 11번).

---

## 8. 열린 작업 / TODO 후보

- [ ] 졸업장(6개월 달성) 발급 화면/연출이 실제로 완성됐는지 점검. (설정탭에 "6개월 연속 달성 시 졸업장 발급 0/6" 표기는 있음)
- [ ] Supabase `push_subscriptions` 익명 RLS 정책 확인/정리 → 푸시 신뢰성.
- [ ] 구버전 `DEV_CHECKLIST.md` 정리 또는 삭제.
- [ ] 미사용 자산 확인/정리(예: `th_01.jpg`, `home.png` 사용처).
- [ ] 돌아보기 '소비 심리 분석' 문구/로직 고도화 여지.

---

## 9. 작업 규칙

- 브랜치 `claude/ecstatic-brahmagupta-igEub`에서 작업·커밋·푸시.
- 커밋 후 서버에서 `git pull`로 배포.
- index.html 수정 시, 커밋 전 아래로 문법 검증:
  ```bash
  python3 - <<'EOF'
  import re
  s = open('index.html', encoding='utf-8').read()
  for m in re.finditer(r'<script>(.*?)</script>', s, re.S):
      if 'initSupabase' in m.group(1):
          open('/tmp/_app.js','w').write(m.group(1)); break
  EOF
  node --check /tmp/_app.js
  ```

---

## 10. 한 줄 요약
"혼내지 않는 가계부. 돈을 친구처럼 여기고, 잘 쓴 소비엔 돈이가 '고마워'라고 답하며, 6개월 습관을 이어가면 졸업하는, 로그인 없는(로컬 전용) 감성 소비 성찰 PWA."
