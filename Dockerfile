# Node 24 LTS, pinned by digest so two builds of one tag use the same base; Dependabot
# proposes new digests. The major is also set in .github/workflows/ci.yml: move both.
FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS base
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Inlined into the bundle at build time: CI passes the production values (ci.yml, image job).
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NODE_ENV=production
RUN npm run build

# Only the standalone server and the files it traced: no dev dependencies, no npm needed.
# The files stay root's, so the server cannot change its own code.
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# server.js listens on HOSTNAME; the default would be the container's own hostname only.
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
