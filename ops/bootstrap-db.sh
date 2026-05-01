#!/usr/bin/env bash
# One-time / upgrade: create .env.db with secrets, start Postgres, sync DATABASE_URL into .env
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Install Docker first (e.g. sudo apt-get install -y docker.io docker-compose-plugin)"
  exit 1
fi

# Use Docker as current user if allowed; otherwise sudo (typical when user not in "docker" group).
if docker info >/dev/null 2>&1; then
  DC=(docker compose)
elif sudo docker info >/dev/null 2>&1; then
  DC=(sudo docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  echo "Docker not installed or daemon not reachable. Install Docker and ensure the service runs."
  exit 1
fi

if [ ! -f .env.db ]; then
  if [ ! -f docker-compose.env.example ]; then
    echo "docker-compose.env.example missing"
    exit 1
  fi
  cp docker-compose.env.example .env.db
  PW="$(openssl rand -base64 18 | tr -dc 'a-zA-Z0-9' | head -c 20)"
  sed -i.bak "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${PW}/" .env.db && rm -f .env.db.bak
  echo "Created .env.db with random password."
fi

"${DC[@]}" up -d

# Wait until Postgres accepts connections (avoids immediate prisma migrate failures).
for _ in $(seq 1 60); do
  if "${DC[@]}" exec -T postgres pg_isready -U inji -d inji >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

set -a
# shellcheck disable=SC1090
source .env.db
set +a

URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5433/${POSTGRES_DB}?schema=public"
if [ ! -f .env ]; then
  echo "DATABASE_URL=${URL}" > .env
  echo "Created .env with DATABASE_URL for compose Postgres."
else
  if grep -q '^DATABASE_URL=' .env; then
    if grep -q '127.0.0.1:5433' .env 2>/dev/null || grep -q 'localhost:5433' .env 2>/dev/null; then
      sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=${URL}|" .env && rm -f .env.bak
      echo "Updated DATABASE_URL in .env"
    else
      echo ".env already has DATABASE_URL pointing elsewhere; not overwriting. Add or edit manually:"
      echo "DATABASE_URL=${URL}"
    fi
  else
    echo "DATABASE_URL=${URL}" >> .env
    echo "Appended DATABASE_URL to .env"
  fi
fi

echo "Postgres should be listening on 127.0.0.1:5433. Run: npx prisma migrate deploy"
