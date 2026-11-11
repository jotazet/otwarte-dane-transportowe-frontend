# Production deployment (Docker Compose)

The frontend runs with a single Docker Compose command. Configuration (API URL, site URL, port) lives in `.env`. Production is updated by release tags `vX.Y.Z` ([section 6](#6-releases-automatic-deployment-from-github)); sections 1–5 describe the setup underneath and a deployment by hand.

> **Note:** Next.js inlines `NEXT_PUBLIC_*` variables into the bundle at **build** time, not when the container starts. That is why they are passed as build args, and every change to them needs a **rebuild** (`--build`), not just a restart.

## 1. Configuration

```bash
cp .env.example .env
```

Fill in `.env`:

- `NEXT_PUBLIC_API_BASE_URL` – public API URL, e.g. `https://v2.api.odt.org.pl`
- `NEXT_PUBLIC_SITE_URL` – public site URL, e.g. `https://v2.odt.org.pl`
- `FRONTEND_PORT` – host port (default `3000`)
- `FRONTEND_BIND` – host address of the port (default `127.0.0.1`, for a reverse proxy on the same host). The container trusts `X-Forwarded-For`, so use `0.0.0.0` only for testing from the LAN.
- `API_HOSTNAME` – the host of `NEXT_PUBLIC_API_BASE_URL`, e.g. `api.odt.org.pl`, when the API's reverse proxy runs on this machine: server-side rendering then reaches it directly, not through the CDN (see [section 4](#4-reverse-proxy--tls)). Leave unset otherwise.

## 2. Build and start

```bash
docker compose up -d --build
```

## 3. Verification

```bash
# the API host from .env must be in the built bundle (it is absent when the build did not get it):
API_HOST=$(grep '^NEXT_PUBLIC_API_BASE_URL=' .env | cut -d= -f2- | sed 's#^https\?://##')
docker exec odt-frontend sh -c "grep -rlo '$API_HOST' .next/ | wc -l"   # more than 0
# the landing page returns 200 (use your FRONTEND_PORT):
curl -i http://localhost:3000/pl
# with API_HOSTNAME: the API host resolves to this machine and answers (prints its address, then OK):
API_HOSTNAME=$(grep '^API_HOSTNAME=' .env | cut -d= -f2-)
docker exec odt-frontend sh -c "grep ' $API_HOSTNAME\$' /etc/hosts; wget -q -O /dev/null 'https://$API_HOSTNAME/api/blog/posts/?page_size=1' && echo OK"
```

Don't check for the absence of `http://localhost:8000`: it is always in the bundle as the fallback after `||` in `lib/config.ts` and `next.config.ts`, even when the API URL was inlined correctly.

## 4. Reverse proxy + TLS

Put a reverse proxy (nginx/Caddy) in front of the container that routes the site's domain to `127.0.0.1:${FRONTEND_PORT}` and forwards the `X-Forwarded-Proto: https` header and the visitor's IP in `X-Forwarded-For` (the rightmost entry is used). With Caddy:

```caddy
example.org {
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Forwarded-For {client_ip}
    }
}
```

Server-side rendering forwards that IP to the API, so the backend rate-limits each visitor separately. With `API_HOSTNAME` these calls reach the API's reverse proxy on this machine instead of the CDN, which would replace the IP; that proxy must accept `X-Forwarded-For` from the Docker networks. Its configuration and the deployment order are in [section 13 of the backend's `docs/deployment.md`](https://github.com/jotazet/OtwarteDaneTransportowe-backend/blob/main/docs/deployment.md#client-ip-cdn-and-the-frontend); background in [ADR 0011](https://github.com/jotazet/OtwarteDaneTransportowe-backend/blob/main/docs/architecture/decisions/0011-client-ip-behind-cloudflare-and-ssr.md).

The application sets its own security headers on every response (`securityHeaders` in `next.config.ts`), including `Strict-Transport-Security` for two years without `includeSubDomains`: serve the site's domain over HTTPS only. The reverse proxy does not need to add them.

## 5. Updates by hand

```bash
git pull
docker compose up -d --build
```

On production use a release (section 6): its `.env` is generated, and a hand edit is overwritten by the next release.

## 6. Releases: automatic deployment from GitHub

A release tag `vX.Y.Z` on `main` deploys itself, the same way as the backend ([backend ADR 0013](https://github.com/jotazet/OtwarteDaneTransportowe-backend/blob/main/docs/architecture/decisions/0013-release-tags-deploy-from-a-server-runner.md), [backend `docs/deployment.md`, section 20](https://github.com/jotazet/OtwarteDaneTransportowe-backend/blob/main/docs/deployment.md#20-releases-automatic-deployment-from-github)). A change that also needs the backend is released there first.

1. **CI** (`.github/workflows/ci.yml`) runs every check on the tag on GitHub's runners. The `deploy` job runs only when they pass, on the self-hosted runner on the server registered to this repository (label `odt-production`, user `odt-runner`), and writes `.env` from the environment's variables (`scripts/deploy/envfile.sh`).
2. It runs `/usr/local/sbin/odt-deploy-frontend` through sudo as `rocky`, the owner of the checkout. That command checks that the tag is `vX.Y.Z` on `main` and the checkout is clean, checks the tag out and runs its `scripts/deploy/release.sh`.
3. **`release.sh`** waits for no backend planner graph build to run (a Next.js build beside one risks the OOM killer), keeps the running image as `odt-frontend:previous`, builds the new one with the **new** `.env` while the old container serves, then swaps the container and waits up to 3 minutes for its healthcheck (`/pl`). Any failure stops it and the job turns red; a failure before the swap changes nothing that runs.

There is no database, so there is no backup step.

### Releasing

Merge to `main`, then on GitHub: _Releases → Draft a new release → Choose a tag →_ a new tag `vX.Y.Z` on `main` → _Generate release notes → Publish_. Or from a clean `main`:

```bash
git tag -a v1.0.0 -m "v1.0.0" && git push origin v1.0.0
```

[Semantic Versioning](https://semver.org/): MAJOR for a change that needs a coordinated backend release or breaks links, MINOR for features, PATCH for fixes. The job's log shows `odt-deploy-frontend: <old> -> <new>` and `release: vX.Y.Z is live`.

### GitHub environment `production`

_Settings → Environments → New environment_ `production`:

- **Deployment branches and tags:** _Selected branches and tags_, add the tag rule `v*`.
- **Environment variables:** `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` (required: without them the build falls back to `http://localhost:8000` and the site still answers), `FRONTEND_BIND`, `FRONTEND_PORT` and `API_HOSTNAME` (optional, section 1). There are no secrets: everything here ends up in the public bundle or the Compose file.

Values may hold only letters, digits and `. : / _ -`. Only the variables named in `scripts/deploy/envfile.sh` reach the server (see its header for adding one).

Also under _Settings → Actions → General → Fork pull request workflows from outside collaborators_, choose **Require approval for all outside collaborators**: a pull request can change `ci.yml` and send a job to the server's runner, so read a fork's workflow changes before approving its run.

To copy the current values from the server once (with the [GitHub CLI](https://cli.github.com/), signed in to this repository; the file holds no secrets):

```bash
ssh rocky@<host> 'grep -E "^[A-Z_]+=" otwarte-dane-transportowe-frontend/.env' > frontend.env
cat frontend.env   # check: no quotes, no comments
gh variable set --env production -f frontend.env && rm frontend.env
gh variable list --env production
```

### One-time server setup

The user `odt-runner` and the directory `/opt/actions-runner/` already exist from the backend (its section 20). As the admin user (`rocky`), with this checkout in `~/otwarte-dane-transportowe-frontend`:

```bash
# The deploy command, owned by root; reinstall it whenever scripts/deploy/odt-deploy-frontend changes.
sudo install -o root -g root -m 755 scripts/deploy/odt-deploy-frontend /usr/local/sbin/odt-deploy-frontend

# odt-runner may also run this command as rocky; a file of its own leaves the backend's untouched.
echo 'odt-runner ALL=(rocky) NOPASSWD: /usr/local/sbin/odt-deploy-frontend' \
  | sudo tee /etc/sudoers.d/odt-runner-frontend > /dev/null
sudo chmod 440 /etc/sudoers.d/odt-runner-frontend && sudo visudo -cf /etc/sudoers.d/odt-runner-frontend
```

The runner (version, checksum and registration token from this repository's _Settings → Actions → Runners → New self-hosted runner_; the label is the same as the backend's, because a runner registered to one repository never takes another repository's jobs):

```bash
sudo install -d -o odt-runner -g odt-runner -m 750 /opt/actions-runner/odt-frontend
curl -fsSLO https://github.com/actions/runner/releases/download/v<version>/actions-runner-linux-x64-<version>.tar.gz
echo "<sha256>  actions-runner-linux-x64-<version>.tar.gz" | sha256sum -c
sudo -u odt-runner tar xzf actions-runner-linux-x64-<version>.tar.gz -C /opt/actions-runner/odt-frontend
cd /opt/actions-runner/odt-frontend
sudo -u odt-runner ./config.sh --unattended --url https://github.com/jotazet/otwarte-dane-transportowe-frontend \
  --token <registration token> --name odt-vps-frontend --labels odt-production --work _work
sudo ./svc.sh install odt-runner && sudo ./svc.sh start
```

Check the restriction without deploying:

```bash
sudo -u odt-runner sudo -n -u rocky /usr/local/sbin/odt-deploy-frontend nope < /dev/null
# odt-deploy-frontend: expected a release tag vX.Y.Z, got 'nope'
```

### Changing a setting

Change the variable in the environment, then deploy: a new release, or _Re-run jobs_ on the latest release's run (it uses the workflow of that tag and today's settings). Every `NEXT_PUBLIC_*` change needs that rebuild anyway.

### Rolling back

- Release a fix (`vX.Y.Z+1` with the revert), or _Re-run jobs_ on the previous release's run.
- **Emergency:** `docker image tag odt-frontend:previous odt-frontend:latest && docker compose up -d --wait` runs the previous image without a build. The checkout and `.env` stay on the new release until the next deployment.

## CORS (backend)

The site calls the API from the browser, so add the site's origin to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in the backend configuration. Otherwise the browser blocks the requests even though the endpoint is correct. See the backend's `docs/deployment.md`.
