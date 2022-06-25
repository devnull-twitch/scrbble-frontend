FROM node:18-alpine AS build

WORKDIR /app

COPY . .

RUN npm install && \
    npm run build

FROM nginx:mainline-alpine

COPY --from=build /app/dist /usr/share/nginx/html