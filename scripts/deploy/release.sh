#!/bin/sh
# Deploys the checked-out release: the image is built with the new .env (NEXT_PUBLIC_* are
# baked in at build time) while the old container keeps serving, then the new .env is
# installed, the container recreated, and it must turn healthy. Any failure stops it there.
# odt-deploy-frontend runs it after checking out the tag (docs/deployment.md, section 6);
# it also works by hand from the checkout:
#
#   sh scripts/deploy/release.sh <tag> <new .env>
set -eu

tag="$1"
env_new="$2"

cd "$(dirname "$0")/../.."
log() { echo "release: $*"; }

# A planner graph build or feed test of the backend (containers labelled odt.planner) holds
# up to 8 GB of RAM and swap: a Next.js build beside it risks the OOM killer. Nothing has
# changed yet, so release again later.
if [ -n "$(docker ps -q --filter label=odt.planner)" ]; then
    log "a planner graph build is running; release again when it has finished" >&2
    exit 1
fi

# The image running now stays as :previous for a quick manual rollback (section 6); taken
# from the container, not :latest, which a failed earlier attempt may have rebuilt already.
running="$(docker compose images -q frontend 2>/dev/null || true)"
[ -z "$running" ] || docker image tag "$running" odt-frontend:previous
# --env-file: the build args come from the new .env. --pull: the newest node:20-alpine.
docker compose --env-file "$env_new" build --pull frontend

install -m 600 "$env_new" .env
# --wait: until the healthcheck in docker-compose.yml passes.
if ! docker compose up -d --wait --wait-timeout 180 frontend; then
    log "the site did not turn healthy" >&2
    docker compose ps >&2
    exit 1
fi
log "$tag is live"

# Only this project's replaced images: the host runs other projects too.
docker image prune -f --filter label=org.opencontainers.image.title=odt-frontend > /dev/null
# Build cache older than a week, of every project on the host (as the backend's release
# does): only a cache, so another project at most builds slower. The release is live.
docker builder prune -f --filter until=168h > /dev/null || log "could not prune the build cache"
