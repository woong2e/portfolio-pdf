#!/bin/bash

# ENV vars CHANGED_FRONTEND, CHANGED_BACKEND are injected by GitHub Actions (ssh-action)
CHANGED_FRONTEND=${CHANGED_FRONTEND:-false}
CHANGED_BACKEND=${CHANGED_BACKEND:-false}

# 1. Swap 메모리 설정 (기존 유지)
if [ ! -f /swapfile ]; then
    echo "⚠️ Swap 메모리 생성 (2GB)..."
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap 메모리 설정 완료"
fi

echo "🚀 배포 시작..."

# 2. 공용 네트워크 생성
docker network create app-network 2>/dev/null || true

# 3. SQLite DB 파일 생성 (도커 볼륨 마운트 오류 방지)
if [ ! -f "portfolio.db" ]; then
    echo "📄 SQLite 데이터베이스 파일(portfolio.db) 초기화..."
    touch portfolio.db
fi

echo "☕ Application 배포 준비..."

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml 파일이 없습니다!"
    exit 1
fi

SERVICES_TO_PULL=""

if [ "$CHANGED_FRONTEND" = "true" ]; then
    SERVICES_TO_PULL="$SERVICES_TO_PULL frontend"
fi

if [ "$CHANGED_BACKEND" = "true" ]; then
    SERVICES_TO_PULL="$SERVICES_TO_PULL backend"
fi

# 4. 지정된 서비스만 pull (변경된 이미지만)
if [ -n "$SERVICES_TO_PULL" ]; then
    echo "🔄 업데이트된 서비스 Pull:$SERVICES_TO_PULL"
    docker-compose -f docker-compose.yml pull $SERVICES_TO_PULL
fi

# 전체 백그라운드 실행. (변경된 이미지가 있는 컨테이너만 자동으로 재생성됨)
echo "🚀 Docker Compose Up..."
docker-compose -f docker-compose.yml up -d

# 5. 미사용 이미지 정리
docker image prune -f

echo "✅ 배포 완료!"