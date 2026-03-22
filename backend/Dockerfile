# 빌드 단계
FROM golang:1.21-alpine AS builder

WORKDIR /app

# SQLite는 CGO를 요구합니다. (C 컴파일러 설치)
RUN apk add --no-cache gcc musl-dev

# go.mod 및 go.sum 복사
COPY go.mod go.sum ./

# 의존성 패키지 다운로드
RUN go mod download

# 소스코드 전체 복사
COPY . .

# SQLite 드라이버를 위해 CGO를 활성화하여 Go 앱 빌드
RUN CGO_ENABLED=1 GOOS=linux go build -o main .

# 실행 단계
FROM alpine:latest

WORKDIR /app

# 시간대(timezone) 설정 및 SSL 인증서 설치
RUN apk --no-cache add ca-certificates tzdata

# 이전 빌드 단계에서 생성된 바이너리 실행 파일 복사
COPY --from=builder /app/main .

# 데이터가 저장될 디렉토리 생성 및 권한 부여
RUN mkdir -p /data/portfolios && chmod -R 777 /data/portfolios

# 애플리케이션 포트 오픈
EXPOSE 8080

# 서버 실행
CMD ["./main"]
