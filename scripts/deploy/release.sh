#!/bin/sh
# Deploys a release from the deployment directory: the .env from the host file, the
# release's image (which changes nothing running), then the container recreated, and it
# must turn healthy. Any failure stops it there. odt-deploy-frontend runs it after copying
# the release's Compose file and scripts into the deployment directory (docs/deployment.md,
# section 6); it also works by hand from there, as odt:
#
#   sh scripts/deploy/release.sh vX.Y.Z /etc/odt/frontend-host.env
set -eu

tag="$1"
host_env="$2"
RELEASES_KEEP=3
WAIT_TIMEOUT=180
# The values of docker-compose.yml the host may set. Every other name is refused, Compose's
# own COMPOSE_* included (they could load other Compose files or rename the project).
HOST_KEYS='FRONTEND_BIND|FRONTEND_PORT|FRONTEND_MEM_LIMIT|API_HOSTNAME'
VALUE='[A-Za-z0-9.:/_-]*'

cd "$(dirname "$0")/../.."
log() { echo "release: $*"; }
# Only this file: a docker-compose.override.yml in the directory is never merged in.
compose() { docker compose -f docker-compose.yml "$@"; }

# The version is the tag of the image CI pushed for it (ghcr.io/...:vX.Y.Z).
if ! printf '%s\n' "$tag" | grep -Eqx 'v[0-9]+\.[0-9]+\.[0-9]+'; then
    log "expected a release tag vX.Y.Z, got '$tag'" >&2
    exit 1
fi

# Every line is blank, a comment, or NAME=value with a known name and a value of URL, host
# and port characters only (no quotes, $, spaces or #), so Compose reads it back exactly.
refused="$(grep -Ev '^[[:space:]]*(#|$)' "$host_env" | grep -Evx "($HOST_KEYS)=$VALUE" \
    | cut -d= -f1 | tr '\n' ' ' || true)"
if [ -n "$refused" ]; then
    log "$host_env may set only $HOST_KEYS, to letters, digits and . : / _ -;" \
        "refused: $refused" >&2
    exit 1
fi

env_new="$(mktemp)"
trap 'rm -f "$env_new"' EXIT
grep -Ex "($HOST_KEYS)=$VALUE" "$host_env" > "$env_new" || true
# Compose takes the image tag from ODT_VERSION (docker-compose.yml).
printf 'ODT_VERSION=%s\n' "$tag" >> "$env_new"
compose --env-file "$env_new" pull --quiet frontend

install -m 600 "$env_new" .env
# --wait: until the healthcheck in docker-compose.yml passes. --no-build: this host never
# builds; it runs the image CI pushed.
if ! compose up -d --no-build --wait --wait-timeout "$WAIT_TIMEOUT" frontend; then
    log "the site did not turn healthy within ${WAIT_TIMEOUT}s" >&2
    compose ps -a >&2
    compose logs --tail 50 frontend >&2
    exit 1
fi
log "$tag is live"

# The images of the newest $RELEASES_KEEP releases stay for a rollback (section 6); the
# registry keeps every one.
repository=ghcr.io/jotazet/odt-frontend
docker image ls "$repository" --format '{{.Tag}}' | grep -Ex 'v[0-9]+\.[0-9]+\.[0-9]+' \
    | sort -V | head -n "-$RELEASES_KEEP" | sed "s|^|$repository:|" \
    | xargs -r docker image rm > /dev/null || log "could not remove old release images"
