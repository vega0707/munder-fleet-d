#!/usr/bin/env bash
# Start Multica official self-host stack from refs/multica (upstream default path).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MUL="$ROOT/refs/multica"
TAG="${MULTICA_IMAGE_TAG:-v0.4.37}"

if [[ ! -d "$MUL/.git" ]]; then
  echo "refs/multica missing — run ./scripts/bootstrap.sh first" >&2
  exit 1
fi

if ! command -v docker >/dev/null; then
  echo "docker not found" >&2
  exit 1
fi

# Nested-container / Cloud Agent: bridge hairpin sometimes blackholes inter-container TCP.
if [[ "${MULTICA_FIX_BRIDGE_NF:-1}" == "1" ]]; then
  if command -v sysctl >/dev/null; then
    sudo sysctl -w net.ipv4.ip_forward=1 >/dev/null || true
    sudo sysctl -w net.bridge.bridge-nf-call-iptables=0 >/dev/null 2>&1 || true
  fi
fi

cd "$MUL"
if [[ ! -f .env ]]; then
  cp .env.example .env
  JWT=$(openssl rand -hex 32)
  PGPASS=$(openssl rand -hex 24)
  VCSKEY=$(openssl rand -base64 32)
  sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT/" .env
  sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$PGPASS/" .env
  sed -i -E "s#^(DATABASE_URL=postgres://[^:]+:)[^@]*(@.*)#\1$PGPASS\2#" .env || true
  sed -i "s#^MULTICA_VCS_SECRET_KEY=.*#MULTICA_VCS_SECRET_KEY=$VCSKEY#" .env || true
fi

grep -q '^MULTICA_IMAGE_TAG=' .env && sed -i "s/^MULTICA_IMAGE_TAG=.*/MULTICA_IMAGE_TAG=$TAG/" .env || echo "MULTICA_IMAGE_TAG=$TAG" >> .env
# Local/private demo login without Resend: fixed code only honored when APP_ENV=development
grep -q '^APP_ENV=' .env && sed -i 's/^APP_ENV=.*/APP_ENV=development/' .env || echo 'APP_ENV=development' >> .env
grep -q '^MULTICA_DEV_VERIFICATION_CODE=' .env && sed -i 's/^MULTICA_DEV_VERIFICATION_CODE=.*/MULTICA_DEV_VERIFICATION_CODE=888888/' .env || echo 'MULTICA_DEV_VERIFICATION_CODE=888888' >> .env

echo "==> Pull + up Multica selfhost (tag=$TAG)"
docker compose -f docker-compose.selfhost.yml pull
docker compose -f docker-compose.selfhost.yml up -d

echo "==> Waiting for /healthz"
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8080/healthz >/dev/null 2>&1; then
    curl -fsS http://127.0.0.1:8080/healthz
    echo
    echo "Frontend: http://localhost:3000"
    echo "Backend:  http://localhost:8080"
    echo "Login: open Web, request code; use 888888 if APP_ENV=development, or read backend logs for [DEV] Verification code"
    exit 0
  fi
  sleep 3
done

echo "healthz not ready — check: docker compose -f docker-compose.selfhost.yml logs backend" >&2
exit 1
