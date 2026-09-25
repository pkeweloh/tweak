FROM node:16-bullseye AS dev
WORKDIR /app
COPY tweak-backend/package*.json ./
RUN npm install
COPY tweak-backend/ .
EXPOSE 1337
CMD ["npm", "run", "start:dev"]

FROM dev AS build
RUN npm run build && npm prune --production

FROM node:16-bullseye-slim AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 1337
CMD ["node", "dist/main"]
