FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM cgr.dev/chainguard/nginx:latest

ARG APP_NAME=fire-calculator
ARG APP_VERSION=unknown

LABEL org.opencontainers.image.title="${APP_NAME}" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.description="FIRE Calculator — Financial Independence, Retire Early" \
      org.opencontainers.image.base.name="cgr.dev/chainguard/nginx:latest"

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/nginx.default.conf
EXPOSE 8080
