# 새 프로젝트 시작 시 Claude에게 전달할 컨텍스트

> 이 문서를 새 Claude Code 세션 첫 메시지에 통째로 붙여넣으세요.

---

## 1. 서버 환경

- **서버**: Oracle Cloud (Ubuntu)
- **서버 IP**: `168.107.15.55`
- **SSH 접속**: `ssh -i ~/Downloads/ssh-key-2026-05-25.key ubuntu@168.107.15.55`
- **프로세스 관리**: PM2
- **리버스 프록시**: nginx + Let's Encrypt SSL (Certbot 자동 갱신)
- **nginx 설정 위치**: `/etc/nginx/sites-enabled/`
- **기존 운영 앱**: `yozmcopy` (건드리지 말 것)

---

## 2. 배포 흐름

```
코드 작성 (Claude Code) → GitHub push → 서버에서 git pull → pm2 restart
```

### 새 앱 배포 시 순서
```bash
# 서버 접속
ssh -i ~/Downloads/ssh-key-2026-05-25.key ubuntu@168.107.15.55

# 프로젝트 클론
cd ~
git clone https://github.com/kimminji302/<레포명>
cd <레포명>

# PM2로 실행 (정적 파일 서버)
pm2 serve . <포트번호> --name <앱이름> --spa
pm2 save

# 이후 배포 시
git pull origin main && pm2 restart <앱이름>
```

### nginx 새 도메인 등록
```bash
sudo nano /etc/nginx/sites-available/<앱이름>
# 설정 작성 후
sudo ln -s /etc/nginx/sites-available/<앱이름> /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL 발급
sudo certbot --nginx -d <도메인>
```

### nginx 설정 템플릿
```nginx
server {
    server_name <도메인> www.<도메인>;

    location /.well-known/ {
        root /home/ubuntu/<프로젝트폴더>/public;
    }

    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        proxy_pass http://127.0.0.1:<포트>;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl; # managed by Certbot
    # ... certbot이 자동 추가
}
```

---

## 3. 포트 현황 (충돌 주의)
- `3001`: doni 앱 (doniapp.kr)
- `그 외`: yozmcopy 등 기존 앱 확인 후 빈 포트 사용

새 포트 확인:
```bash
pm2 list
sudo netstat -tlnp | grep LISTEN
```

---

## 4. 캐시 문제 (반드시 처음부터 대응)

### 문제
- 배포해도 사용자 브라우저가 옛날 버전을 보여줌
- 메타태그 `no-cache`는 브라우저가 무시하는 경우 많음

### 해결책
1. **nginx에서 HTTP 헤더로 강제** (위 nginx 설정 참고)
2. **Service Worker 추가** (`sw.js`) — 배포마다 `CACHE_VERSION` 올리면 자동 갱신

```javascript
// sw.js 기본 템플릿
const CACHE_VERSION = 'app-v1'; // 배포마다 v2, v3... 올리기

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    // HTML은 항상 최신
    e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request)));
  } else {
    // 정적 에셋은 캐시 우선
    e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
  }
});
```

```html
<!-- index.html에 등록 -->
<script>
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
</script>
```

---

## 5. 다크모드 구현 주의사항

### 삼성 인터넷 브라우저 "어둡게 보기" 문제
- OS 다크모드와 무관하게 브라우저가 페이지 전체에 자체 필터 적용
- `prefers-color-scheme: dark`를 트리거하지 않아 앱이 감지 못함
- 해결: CSS에 아래 반드시 추가

```css
:root { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }
```

### 다크모드 3단계 설계 (권장)
- `white`: 앱 자체 라이트 테마
- `dark`: 앱 자체 다크 테마
- `system`: OS 설정 자동 감지 (기본값)

```javascript
function applyTheme(theme) {
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

// OS 변경 감지
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if ((localStorage.getItem('theme') || 'system') === 'system') applyTheme('system');
});

// 초기화 (FOUC 방지 — head에서 즉시 실행)
applyTheme(localStorage.getItem('theme') || 'system');
```

### 이미지 다크모드 대응
- `filter: invert()` 방식 **사용 금지** — 브라우저마다 다르게 렌더링됨
- **다크용/라이트용 이미지 파일을 별도 제작**해서 분리 사용

```javascript
// 테마에 따라 이미지 src 교체
const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
img.src = isDark ? 'logo_dark.png' : 'logo_light.png';
```

---

## 6. TWA (Android 앱) 관련

- TWA는 웹사이트를 크롬으로 감싸는 구조 → **웹 코드 변경은 APK 재빌드 없이 자동 반영**
- APK 재빌드 필요한 경우: 앱 아이콘, 패키지명, themeColor 등 네이티브 설정만

### TWA에서 작동 안 하는 것들
| 기능 | 문제 | 해결 |
|---|---|---|
| `alert()` | 완전 차단 | 커스텀 모달로 교체 |
| `confirm()` | 완전 차단 | Promise 기반 커스텀 모달 |
| `prompt()` | 완전 차단 | 인풋 포함 모달 |

### Google OAuth 로그인
- 테스트 앱에서 로그인 시 `403 disallowed_useragent` 에러
- Play Console → 비공개 테스트 → **테스터 이메일 등록 필수**
- 등록 후 테스터에게 참여 링크 전송 → 수락해야 사용 가능

---

## 7. Supabase 사용 시

### 무료 플랜 제한
- **7일간 API 요청 없으면 프로젝트 자동 일시정지**
- 출시 전: 주 1회 사이트 접속으로 유지
- 사용자 늘면 유료 플랜 전환 ($25/월)
- DB 용량 무료 한도: 500MB

### 필수 설정
```sql
-- RLS 항상 활성화
alter table public.<테이블명> enable row level security;

-- 본인 데이터만 접근
create policy "본인 데이터만" on public.<테이블명>
  for all using (auth.uid() = user_id);
```

### Supabase 상태 확인
```bash
curl https://<프로젝트>.supabase.co/auth/v1/health \
  -H "apikey: <anon_key>"
# 200 OK면 정상, 프로젝트 일시정지 시 503
```

---

## 8. 디버깅 체크리스트

문제 발생 시 이 순서로 확인:

```bash
# 1. 사이트 응답 확인
curl -sI https://<도메인>/

# 2. PM2 프로세스 상태
pm2 list

# 3. nginx 설정/포트 확인
sudo cat /etc/nginx/sites-enabled/*

# 4. 앱 로그 확인
pm2 logs <앱이름> --lines 50

# 5. Supabase 상태
curl https://<프로젝트>.supabase.co/auth/v1/health -H "apikey: <key>"
```

---

## 9. 참고 레포
- **doni 앱**: `https://github.com/kimminji302/doni` — 실제 구현 레퍼런스
