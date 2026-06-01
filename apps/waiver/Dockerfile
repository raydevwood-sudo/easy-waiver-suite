# ---- build ----
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/waiver/ apps/waiver/

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @easy-waiver/waiver build

# ---- serve ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/waiver/dist /usr/share/nginx/html
EXPOSE 80
