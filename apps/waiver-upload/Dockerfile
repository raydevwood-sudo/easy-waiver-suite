# ---- build ----
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/waiver-upload/ apps/waiver-upload/

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @easy-waiver/waiver-upload build

# ---- serve ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/waiver-upload/dist /usr/share/nginx/html
EXPOSE 80
