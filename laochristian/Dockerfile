# Base image
FROM node:23-bullseye AS base
WORKDIR /app
COPY package*.json ./

# Install only to cache layer
RUN npm install

# ================================
# 🔧 Development Stage
# ================================
FROM base AS dev
WORKDIR /app
COPY . .
# Optional: format or lint
RUN npm run format || true

# This image runs Vite with hot reload via docker-compose command

# ================================
# 🚀 Build Stage
# ================================
FROM base AS build
WORKDIR /app
COPY . .
RUN npm run build

# ================================
# 🏃 Production Runner
# ================================
FROM node:23-bullseye AS runner
WORKDIR /app

# Install a minimal static server
RUN npm install -g serve

# Copy only built files and static assets
COPY --from=build /app/dist ./dist

# Serve on port 4173 (default for serve)
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
