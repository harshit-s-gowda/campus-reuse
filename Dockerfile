FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend ./frontend
COPY backend ./backend
COPY public ./public
COPY vite.config.ts tsconfig.json app.config.ts ./
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend ./frontend
COPY backend ./backend
COPY public ./public
COPY vite.config.ts tsconfig.json app.config.ts ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
COPY --from=build /app/backend/dist ./backend/dist
EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
