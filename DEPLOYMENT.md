# 배포 가이드

## Docker 배포 시 주의사항

### 환경변수 설정

Next.js standalone 모드에서는 **런타임 환경변수**가 필요합니다. Docker 컨테이너 실행 시 반드시 환경변수를 전달해야 합니다.

#### 방법 1: Docker run 명령어로 환경변수 전달

```bash
docker run --network=host \
  -e NODE_ENV=production \
  -e DB_HOST=your_db_host \
  -e DB_PORT=3306 \
  -e DB_USER=your_db_user \
  -e DB_PASSWORD=your_db_password \
  -e DB_DATABASE=moneymate \
  -e NEXTAUTH_URL=https://your-domain.com \
  -e NEXTAUTH_SECRET=your_secret_key \
  your-image-name
```

#### 방법 2: .env 파일 사용

`.env` 파일을 생성하고:

```bash
docker run --network=host --env-file .env your-image-name
```

#### 방법 3: Docker Compose 사용

`docker-compose.yml` 파일 생성:

```yaml
version: '3.8'

services:
  app:
    build: .
    network_mode: host
    environment:
      - NODE_ENV=production
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_DATABASE=${DB_DATABASE}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    restart: unless-stopped
```

그리고 `.env` 파일에 환경변수 설정:

```env
DB_HOST=your_db_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=moneymate
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secret_key
```

실행:

```bash
docker-compose up -d
```

## 문제 해결

### 1. 환경변수가 로드되지 않는 경우

**증상**: API 호출 시 "DB env vars are missing" 에러

**해결 방법**:
1. Docker 컨테이너 내부에서 환경변수 확인:
   ```bash
   docker exec -it container-name env | grep DB_
   ```

2. 환경변수가 없다면 Docker 실행 명령어에 `-e` 옵션 추가

3. 로그 확인:
   ```bash
   docker logs container-name | grep "\[DB\]"
   ```

### 2. DB 연결이 안 되는 경우

**증상**: "connect ETIMEDOUT" 또는 "Port connection timeout" 에러

**해결 방법**:
1. Host 네트워크 모드 사용:
   ```bash
   docker run --network=host ...
   ```

2. 헬스체크 API로 진단:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. 방화벽/보안 그룹 확인:
   - DB 서버의 3306 포트가 외부 접근 허용인지
   - Docker 호스트 서버의 방화벽 설정 확인

### 3. API가 500 에러를 반환하는 경우

**디버깅 단계**:

1. **환경변수 확인**:
   ```bash
   # 컨테이너 내부에서
   docker exec -it container-name node -e "console.log(process.env.DB_HOST)"
   ```

2. **로그 확인**:
   ```bash
   docker logs -f container-name
   ```
   
   다음 로그를 확인:
   - `[DB] Initializing connection pool...` - 환경변수 상태
   - `[DB] Connection pool created successfully` - 연결 풀 생성 성공
   - `[DB] Query error:` - 쿼리 에러

3. **헬스체크 API 호출**:
   ```bash
   curl http://localhost:3000/api/health
   ```
   
   응답에서 다음을 확인:
   - `database.connected`: DB 연결 상태
   - `database.error`: 에러 메시지
   - `environment`: 환경변수 설정 상태

## 로그 확인

모든 DB 관련 로그는 `[DB]` 접두사로 시작합니다:

- `[DB] Initializing connection pool...` - 연결 풀 초기화 시작
- `[DB] Connection pool created successfully` - 연결 풀 생성 성공
- `[DB] Query error:` - 쿼리 실행 에러
- `[DB] Failed to create connection pool:` - 연결 풀 생성 실패

## 체크리스트

배포 전 확인사항:

- [ ] 모든 필수 환경변수가 설정되어 있는가?
  - DB_HOST
  - DB_PORT
  - DB_USER
  - DB_PASSWORD
  - DB_DATABASE
  - NEXTAUTH_URL
  - NEXTAUTH_SECRET

- [ ] Docker 컨테이너가 host 네트워크 모드로 실행되는가?
- [ ] DB 서버가 외부 접근을 허용하는가?
- [ ] 방화벽/보안 그룹에서 3306 포트가 열려있는가?
- [ ] 헬스체크 API (`/api/health`)가 정상 동작하는가?

