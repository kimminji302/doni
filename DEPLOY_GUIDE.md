# 오라클 서버 + 웹앱 배포 지침서 (돈이 프로젝트 경험 기반)

## 서버 환경
- 서버: Oracle Cloud, `ubuntu@<서버IP>`
- SSH 키 위치: 로컬 `~/Downloads/*.key`
- 프로세스 관리: PM2
- 리버스 프록시: nginx (Let's Encrypt SSL, Certbot 자동 갱신)
- 기존 nginx 설정 위치: `/etc/nginx/sites-enabled/`

## 새 프로젝트 시작 시 체크리스트

### 1. 서버 배포 구조
- 정적 파일이면 `pm2 serve <폴더경로> <포트> --name <앱이름> --spa`
- 동적 서버면 `server.js` 만들어서 `pm2 start server.js --name <앱이름>`
- **반드시 캐시 헤더 설정**: `index.html`은 `no-cache, no-store, must-revalidate`, 정적 에셋(이미지 등)은 장기 캐시
- nginx에 이미 `Cache-Control` 헤더가 설정되어 있는지 먼저 확인 (`sudo cat /etc/nginx/sites-enabled/*`) — 중복 설정하면 충돌

### 2. PWA / TWA 앱으로 만들 경우
- TWA는 실제 웹사이트를 크롬으로 감싸는 방식 → **웹 코드만 바꾸면 APK 재빌드 불필요**
- APK 재빌드가 필요한 경우만: 앱 아이콘, 패키지명, `themeColorDark` 등 네이티브 설정 변경
- `bubblewrap build` → Play Console 업로드 순서

### 3. 캐시 갱신 문제 (매번 겪는 이슈)
- 브라우저/TWA가 `index.html`을 캐싱해서 배포해도 옛 버전이 보이는 문제 발생 → **반드시 처음부터 대응**
- 해결책 2단계:
  1. 서버에서 `index.html`에 `Cache-Control: no-cache` 헤더 강제 (메타태그만으론 부족, HTTP 헤더 필요)
  2. Service Worker로 정적 에셋 캐시 버전 관리 (`CACHE_VERSION` 배포마다 올리기)
- **삼성 인터넷 브라우저는 별도 주의**: "어둡게 보기" 기능이 OS 다크모드와 무관하게 페이지에 강제 필터 적용 → CSS에 아래 추가 필수:
  ```css
  :root { color-scheme: light; }
  :root[data-theme="dark"] { color-scheme: dark; }
  ```

### 4. 다크모드 구현 시
- 3단계로 설계: **화이트 / 다크 / 시스템(OS 자동)**
- `localStorage`에 저장, 미설정 시 기본값 `system`
- `window.matchMedia('(prefers-color-scheme: dark)')`로 OS 설정 감지 + `change` 이벤트 리스닝
- 이미지(GIF/PNG)는 **CSS filter(invert)로 때우지 말고 다크/라이트 전용 파일 분리 제작** — 브라우저마다 filter 렌더링이 달라서 오류 잦음

### 5. Supabase 사용 시
- **무료 플랜은 7일간 API 요청 없으면 프로젝트 자동 일시정지** → 출시 전엔 주기적 접속으로 유지, 사용자 늘면 유료 전환 검토
- RLS(Row Level Security) 정책 꼭 설정 (`auth.uid() = user_id` 패턴)
- 로그인 시 `loadFromSupabase()` 같은 함수로 로컬 ↔ 클라우드 동기화 구조 만들기

### 6. TWA 환경에서 막히는 것들
- `alert()`, `confirm()` 네이티브 다이얼로그 → TWA에서 깨짐. **커스텀 모달로 대체 필수**
- Google OAuth 로그인 시 `disallowed_useragent` 403 에러 → **비공개 테스트(클로즈드 테스트) 테스터로 등록 안 된 사용자**가 접근하면 발생. Play Console에서 테스터 이메일 추가 필요

### 7. 배포 명령 패턴
```bash
ssh -i <키경로> ubuntu@<서버IP>
cd ~/<프로젝트폴더>
git pull origin main
pm2 restart <앱이름>
```

### 8. Git 작업 팁
- GitHub 웹에서 직접 파일 업로드(`+` → Upload files)도 가능 — 바이너리 파일(이미지)은 GitHub 웹 에디터로 직접 수정 안 됨, 업로드로 교체해야 함
- 로컬/원격 동시 작업 시 `git pull --rebase` 로 충돌 최소화

## 디버깅 시 우선 확인 순서
1. `curl -sI https://<도메인>/` → HTTP 상태 확인
2. `pm2 list` → 프로세스 online 여부
3. `sudo cat /etc/nginx/sites-enabled/*` → 프록시 설정/포트 확인
4. Supabase 쓰면 `curl <supabase-url>/auth/v1/health -H "apikey: ..."` → 200 확인
5. 캐시 의심되면 시크릿 모드 / 다른 브라우저로 먼저 확인
