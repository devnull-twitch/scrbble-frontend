FROM node:18-alpine AS build

WORKDIR /app

COPY . .

ENV BASE_URL api.scrbble.fun
ENV SECURE_BACKEND 1

RUN apk add --no-cache ca-certificates git && \
    npm install && \
    npm run build

FROM nginx:mainline-alpine

COPY --from=build /app/dist /usr/share/nginx/html