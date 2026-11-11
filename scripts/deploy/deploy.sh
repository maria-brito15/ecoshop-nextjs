#!/bin/sh
# =============================================================================
# DEPLOY - ECOSHOP (runs ON THE SERVER; REQ-OPS-10)
# =============================================================================
# Publishes the APP_TAG version: pulls the images, applies the migrations,
# starts the app, checks its health and, if the check fails, goes back to the
# previous version.
#
# Usage (the CI deploy job does this over ssh):
#   APP_TAG=sha-1a2b3c4 ./deploy.sh
#
# Prerequisites on the server, in the same folder as this script:
#   docker-compose.prod.yml and a .env with the required variables
#   (see the header of docker-compose.prod.yml); curl installed.
#
# Guarantees and limits:
# - Any command that fails aborts the script (set -e).
# - If the migrations fail, the old app is NOT touched.
# - The rollback swaps only the app image. It does NOT undo migrations: so every
#   migration must be compatible with the previous version of the application
#   (add before removing).
# - On the first deploy there is no previous version: if the health check fails,
#   the script exits with an error and leaves the app as it is, for inspection.
# =============================================================================

set -eu

: "${APP_TAG:?set APP_TAG to the image tag, for example sha-1a2b3c4}"

cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"
CURRENT_TAG_FILE=.deploy/current-tag
HEALTH_URL=http://127.0.0.1:3000/api/health
ATTEMPTS=12   # 12 attempts x 5 s = 60 s, above the 40 s start_period of the healthcheck
INTERVAL=5

mkdir -p .deploy
PREVIOUS_TAG=""
if [ -f "$CURRENT_TAG_FILE" ]; then
  PREVIOUS_TAG="$(cat "$CURRENT_TAG_FILE")"
fi

echo "==> 1/4 pulling the images ($APP_TAG)"
$COMPOSE pull app migrate

echo "==> 2/4 applying the migrations (the old app keeps running)"
$COMPOSE run --rm migrate

echo "==> 3/4 starting the new application"
$COMPOSE up -d --no-deps app

echo "==> 4/4 checking health at $HEALTH_URL"
healthy=0
attempt=0
while [ "$attempt" -lt "$ATTEMPTS" ]; do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    healthy=1
    break
  fi
  attempt=$((attempt + 1))
  sleep "$INTERVAL"
done

if [ "$healthy" -ne 1 ]; then
  echo "!! the application did not become healthy within $((ATTEMPTS * INTERVAL)) s" >&2
  if [ -n "$PREVIOUS_TAG" ]; then
    echo "!! rolling back to the previous version ($PREVIOUS_TAG)" >&2
    APP_TAG="$PREVIOUS_TAG" $COMPOSE up -d --no-deps app
  else
    echo "!! there is no previous version to go back to (first deploy)" >&2
  fi
  exit 1
fi

echo "$APP_TAG" > "$CURRENT_TAG_FILE"
docker image prune -f >/dev/null
echo "==> deploy finished: $APP_TAG"
