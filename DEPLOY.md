# 배포 방법

## 서버 접속 (Oracle Always Free — doni-server)
```bash
ssh -i ~/Downloads/ssh-key-2026-07-02.key ubuntu@152.67.197.229
```

## 코드 배포
```bash
cd ~/doni && git pull origin claude/ecstatic-brahmagupta-igEub
```

앱은 `pm2 serve`로 정적 서빙 중이라(`pm2 list`로 확인) git pull만 하면 바로 반영됨 — 재시작 불필요.
push-sender.js는 크론이 매 실행 시 새로 띄우므로 이 역시 재시작 불필요.

## 참고
- 크론(저녁 8:30 알림): `crontab -l`로 확인
- pm2 프로세스 확인: `pm2 list`
- 이전 서버(minjicolor2, 168.107.15.55)는 과금 문제로 2026-07-02 Stop 처리함 (Terminate는 아직 안 함)

> 키 파일(`.key`, `.pem`) 자체는 절대 GitHub에 올리지 않음. 이 파일엔 명령어만 저장.
