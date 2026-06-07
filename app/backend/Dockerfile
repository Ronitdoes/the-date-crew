FROM node:22-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm

# Copy root configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
# Copy workspace package.jsons
COPY db/package.json ./db/
COPY app/backend/package.json ./app/backend/
COPY app/frontend/package.json ./app/frontend/

# Install dependencies for the monorepo
RUN pnpm install --filter backend --filter db

# Copy the actual sources
COPY db ./db
COPY app/backend ./app/backend

# Build backend
RUN pnpm --filter backend build

FROM node:22-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm

# Copy root configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY db/package.json ./db/
COPY app/backend/package.json ./app/backend/
COPY app/frontend/package.json ./app/frontend/

# Install only production dependencies
RUN pnpm install --prod --filter backend --filter db

# Copy the built files and migrations from builder
COPY --from=builder /usr/src/app/app/backend/dist ./app/backend/dist
COPY --from=builder /usr/src/app/db/migrations ./db/migrations

EXPOSE 3001
CMD ["node", "app/backend/dist/app/backend/src/index.js"]
