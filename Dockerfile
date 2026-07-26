# Chainguard's free tier only publishes :latest/:latest-dev (no pinned
# version tags without a paid plan), so reproducibility comes from pinning
# to the current digest instead of the floating tag. This trades away
# automatic same-tag security patching for a reproducible build; the repo's
# .github/dependabot.yml (docker ecosystem) opens a PR to bump these digests
# on a schedule so the pin doesn't go stale.
FROM cgr.dev/chainguard/node:latest-dev@sha256:e5c561501b1cd1f83471e932d3cd49d8fbbba998031273e04380b1f3e4199381 AS base
# Already the base image's own default (uid 65532); set explicitly so it's
# visible in this file rather than only implied by the upstream image.
USER 65532
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS deps
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM cgr.dev/chainguard/nginx:latest@sha256:e4ff957080737c90a9ecfeaa40e3d19ea9d687e9cacda2f2a031c75ffcdd72b7 AS prod
USER 65532
ENV NODE_ENV=production
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["nginx", "-t"]
CMD ["-g", "daemon off;"]

FROM deps AS dev
COPY . .
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:5173').then(()=>process.exit(0)).catch(()=>process.exit(1))"]
ENTRYPOINT ["npm"]
CMD ["run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort", "--configLoader", "runner"]
