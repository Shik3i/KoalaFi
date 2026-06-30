# ==========================================
# Stage 1: Build static SvelteKit assets
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy codebase
COPY . .

# Run validations and compilation checks
RUN npm run format:check && \
    npm run check && \
    npm run test:unit -- --run && \
    npm run build

# ==========================================
# Stage 2: Serve static files with Caddy
# ==========================================
FROM caddy:2.8-alpine

# Set default security headers and SPA routing
COPY Caddyfile.example /etc/caddy/Caddyfile

# Copy static assets from builder stage
COPY --from=builder /app/build /srv

EXPOSE 80
EXPOSE 443
