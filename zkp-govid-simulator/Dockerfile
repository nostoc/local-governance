FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/data/citizens.db

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
RUN mkdir -p /app/data

VOLUME ["/app/data"]
EXPOSE 5000

CMD ["npm", "start"]
