FROM node:16-bullseye AS dev
RUN npm install -g @angular/cli@13.2.4
WORKDIR /app
COPY tweak-client/package*.json ./
RUN npm install
COPY tweak-client/ .
EXPOSE 4200
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "1000", "--disable-host-check"]

FROM dev AS build
RUN ng build --configuration production

FROM nginx:alpine AS prod
COPY tweak-client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/tweak-client /usr/share/nginx/html
