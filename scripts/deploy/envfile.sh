#!/bin/sh
# Writes the production .env from the GitHub environment (docs/deployment.md, section 6);
# the deploy job runs it on the runner with the variables below in its environment.
#
#   sh scripts/deploy/envfile.sh <path>
#
# Compose reads .env only to fill in docker-compose.yml, so these are all the names that
# matter: a new one goes into docker-compose.yml, this list and the deploy job together.
# Values are URLs, hosts and ports; anything else ($, quotes, spaces, #) is refused rather
# than quoted, so Compose reads back exactly what GitHub holds.
set -eu

REQUIRED="NEXT_PUBLIC_API_BASE_URL NEXT_PUBLIC_SITE_URL"
OPTIONAL="FRONTEND_BIND FRONTEND_PORT API_HOSTNAME"

path="$1"
# Without these the build falls back to http://localhost:8000 and still looks healthy.
for name in $REQUIRED; do
    eval "value=\${$name:-}"
    if [ -z "$value" ]; then
        echo "::error::The production environment has no variable $name."
        exit 1
    fi
done

umask 077
: > "$path"
for name in $REQUIRED $OPTIONAL; do
    eval "value=\${$name:-}"
    [ -n "$value" ] || continue
    case "$value" in
    *[!A-Za-z0-9.:/_-]*)
        echo "::error::$name may hold only letters, digits and . : / _ -"
        exit 1
        ;;
    esac
    printf '%s=%s\n' "$name" "$value" >> "$path"
done
echo "envfile: $(wc -l < "$path") lines -> $path"
