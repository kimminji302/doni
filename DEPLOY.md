# 배포 방법

## 서버 접속
```bash
ssh -i ~/Downloads/ssh-key-2026-05-25.key ubuntu@168.107.15.55
```

## 코드 배포
```bash
cd ~/doni && git pull origin claude/ecstatic-brahmagupta-igEub
```

> 키 파일(`.key`, `.pem`) 자체는 절대 GitHub에 올리지 않음. 이 파일엔 명령어만 저장.
