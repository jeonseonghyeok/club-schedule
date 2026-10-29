# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS runtime
# 템플릿으로 두면 nginx 이미지가 시작할 때 환경변수(API_UPSTREAM)를 채워 conf.d 로 만든다
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=club-schedule-api-dev:8080
COPY --from=build /workspace/dist /usr/share/nginx/html

EXPOSE 80
