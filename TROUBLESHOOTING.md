# 운영 서버 문제 해결 가이드

## 현재 발생 중인 문제

1. **401 Unauthorized** - `/api/auth/callback/credentials` 호출 시
2. **connect ETIMEDOUT** - `/api/common-codes` 호출 시

## 단계별 진단 및 해결

### 1단계: 컨테이너 상태 확인

```bash
# 컨테이너 실행 상태 확인
docker ps | grep moneymate

# 컨테이너 로그 확인
docker logs moneymate-app --tail 100

# 실시간 로그 모니터링
docker logs moneymate-app -f
```

**확인 사항:**
- 컨테이너가 실행 중인가?
- 에러 로그가 있는가?
- NextAuth 관련 로그가 있는가?

### 2단계: 환경 변수 확인

```bash
# 컨테이너 내부 환경 변수 확인
docker exec moneymate-app env | grep -E "NEXTAUTH|DB_|NEXT_PUBLIC"

# 특정 환경 변수 확인
docker exec moneymate-app node -e "console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)"
docker exec moneymate-app node -e "console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET')"
```

**필수 환경 변수:**
- `NEXTAUTH_URL=https://zzlongns.synology.me:9000`
- `NEXTAUTH_SECRET=your-secret-key` (반드시 설정!)
- `NEXT_PUBLIC_BASE_URL=https://zzlongns.synology.me:9000`
- 모든 DB 관련 환경 변수

### 3단계: 네트워크 연결 테스트

```bash
# 컨테이너 내부에서 헬스체크 테스트
docker exec moneymate-app curl http://127.0.0.1:3000/api/health

# 외부에서 헬스체크 테스트 (리버스 프록시를 통해)
curl https://zzlongns.synology.me:9000/api/health

# DB 연결 테스트
docker exec moneymate-app node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
}).then(() => console.log('DB 연결 성공')).catch(e => console.error('DB 연결 실패:', e.message));
"
```

### 4단계: 포트 매핑 확인

현재 Docker 설정:
```yaml
ports:
  - "127.0.0.1:19000:3000"
```

**문제:** `127.0.0.1`로만 바인딩되어 외부에서 직접 접근 불가

**해결 방법:**

#### 방법 A: 리버스 프록시 사용 (권장)

Synology Reverse Proxy 또는 nginx를 사용하는 경우:

1. **Synology Reverse Proxy 설정:**
   - 소스: `https://zzlongns.synology.me:9000`
   - 대상: `http://127.0.0.1:19000`
   - WebSocket 지원 활성화

2. **nginx 설정 (직접 사용 시):**
```nginx
server {
    listen 9000 ssl;
    server_name zzlongns.synology.me;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:19000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

#### 방법 B: 포트 매핑 변경 (직접 접근 필요 시)

```yaml
ports:
  - "19000:3000"  # 127.0.0.1 제거
```

**주의:** 보안상 리버스 프록시 사용을 권장합니다.

### 5단계: NextAuth 디버깅

NextAuth 로그 확인:

```bash
# NextAuth 관련 로그 확인
docker logs moneymate-app | grep -i "nextauth\|auth"

# 실시간 로그 모니터링
docker logs moneymate-app -f | grep -i "nextauth\|auth"
```

**확인할 로그:**
- `[NextAuth] Config:` - 환경 변수 설정 확인
- `[NextAuth] authorize called` - 로그인 요청 확인
- `[NextAuth] User query result` - DB 쿼리 결과
- `[NextAuth] Login successful` - 로그인 성공

### 6단계: 브라우저 개발자 도구 확인

1. **Network 탭:**
   - 요청 URL 확인
   - 상태 코드 확인
   - 요청/응답 헤더 확인
   - 에러 메시지 확인

2. **Console 탭:**
   - JavaScript 에러 확인
   - API 호출 에러 확인

3. **Application 탭:**
   - Cookies 확인 (NextAuth 관련 쿠키)
   - LocalStorage 확인

## 일반적인 문제 및 해결책

### 문제 1: connect ETIMEDOUT

**원인:**
- 리버스 프록시가 제대로 설정되지 않음
- 컨테이너가 실행되지 않음
- 방화벽/보안 그룹 차단

**해결:**
1. 컨테이너 실행 상태 확인
2. 리버스 프록시 설정 확인
3. 포트 매핑 확인
4. 방화벽 설정 확인

### 문제 2: 401 Unauthorized

**원인:**
- `NEXTAUTH_SECRET` 미설정 또는 불일치
- `NEXTAUTH_URL` 불일치
- 세션 쿠키 문제
- DB 연결 실패로 인한 인증 실패

**해결:**
1. 환경 변수 확인 및 설정
2. 컨테이너 재시작
3. 브라우저 쿠키 삭제 후 재시도
4. DB 연결 확인

### 문제 3: API 호출이 전혀 안 됨

**원인:**
- 네트워크 연결 문제
- CORS 문제
- 리버스 프록시 설정 문제

**해결:**
1. 헬스체크 API 테스트 (`/api/health`)
2. 컨테이너 내부에서 직접 테스트
3. 리버스 프록시 로그 확인

## 환경 변수 체크리스트

운영 서버의 `production.env.ini` 파일에 다음이 모두 포함되어 있는지 확인:

```ini
# 필수 환경 변수
NEXT_PUBLIC_APP_NAME=MoneyMate
NEXT_PUBLIC_BASE_URL=https://zzlongns.synology.me:9000
NODE_ENV=production
TZ=Asia/Seoul

# DB 설정
DB_HOST=zzlongns.synology.me
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD=Dltkdgnsqhdks1!
DB_DATABASE=moneymate

# NextAuth 설정 (필수!)
NEXTAUTH_URL=https://zzlongns.synology.me:9000
NEXTAUTH_SECRET=your-very-secure-secret-key-here-change-this
```

**중요:** `NEXTAUTH_SECRET`은 반드시 설정해야 하며, 임의의 긴 문자열을 사용해야 합니다.

## 컨테이너 재시작

환경 변수를 변경한 후:

```bash
# 컨테이너 중지
docker-compose down

# 환경 변수 파일 확인
cat production.env.ini

# 컨테이너 재시작
docker-compose up -d

# 로그 확인
docker logs moneymate-app -f
```

## 추가 디버깅 명령어

```bash
# 컨테이너 내부 접속
docker exec -it moneymate-app /bin/bash

# Node.js 버전 확인
docker exec moneymate-app node --version

# 프로세스 확인
docker exec moneymate-app ps aux

# 네트워크 연결 확인
docker exec moneymate-app netstat -tuln

# 포트 리스닝 확인
docker exec moneymate-app netstat -tuln | grep 3000
```

## 연락처 및 지원

문제가 지속되면 다음 정보를 수집하여 문의하세요:

1. 컨테이너 로그 (`docker logs moneymate-app`)
2. 환경 변수 확인 결과
3. 헬스체크 API 응답
4. 브라우저 개발자 도구 스크린샷
5. 네트워크 탭의 요청/응답 정보

