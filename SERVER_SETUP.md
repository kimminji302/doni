# 서버 설정 가이드

> 오라클 클라우드 서버 복구 또는 신규 서버 세팅 시 참고

---

## 서버 정보

| 항목 | 내용 |
|------|------|
| 클라우드 | 오라클 클라우드 Always Free |
| 서버 이름 | minjicolor2 |
| OS | Ubuntu 22.04 LTS |
| 공인 IP | 168.107.15.55 |
| 접속 계정 | ubuntu |
| 앱 포트 | 3001 |
| 도메인 | doniapp.kr |

---

## SSH 접속

```bash
ssh -i ~/.ssh/ssh-key-2026-05-25.key ubuntu@168.107.15.55
```

---

## 앱 경로 및 PM2

| 항목 | 내용 |
|------|------|
| 앱 경로 | `/home/ubuntu/doni/` |
| 프로세스 관리 | PM2 |
| PM2 앱 이름 | doni |
| 실행 포트 | 3001 |

### PM2 주요 명령어

```bash
pm2 list              # 실행 중인 앱 목록
pm2 reload doni       # 앱 재시작
pm2 logs doni         # 로그 확인
pm2 stop doni         # 앱 중지
pm2 start doni        # 앱 시작
```

---

## 배포 방법

```bash
cd ~/doni
git pull origin claude/affectionate-edison-qj9I9
pm2 reload doni
```

---

## Nginx 설정

설정 파일 경로: `/etc/nginx/sites-enabled/default`

```nginx
server {
    server_name doniapp.kr www.doniapp.kr;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/doniapp.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/doniapp.kr/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name doniapp.kr www.doniapp.kr;
    return 301 https://$host$request_uri;
}
```

### Nginx 주요 명령어

```bash
sudo nginx -t              # 설정 문법 확인
sudo systemctl reload nginx  # 설정 반영
sudo systemctl status nginx  # 상태 확인
```

---

## SSL 인증서 (Let's Encrypt)

```bash
# 신규 발급
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d doniapp.kr -d www.doniapp.kr

# 갱신 (90일마다 자동 갱신되나 수동 갱신 시)
sudo certbot renew

# 인증서 경로
/etc/letsencrypt/live/doniapp.kr/fullchain.pem
/etc/letsencrypt/live/doniapp.kr/privkey.pem
```

---

## DNS 설정 (가비아)

| 타입 | 호스트 | 값 |
|------|--------|-----|
| A | @ | 168.107.15.55 |
| A | www | 168.107.15.55 |

---

## 신규 서버로 이전 시 순서

1. 새 서버 생성 (Ubuntu 22.04)
2. Node.js, PM2 설치
3. GitHub에서 코드 clone
4. PM2로 앱 실행
5. Nginx 설치 및 설정
6. Let's Encrypt SSL 발급
7. 가비아 DNS A레코드 IP 변경
