# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Delete lock file and reinstall fresh for Alpine (musl) platform
# This fixes the @rollup/rollup-linux-x64-musl optional dependency issue
RUN rm -f package-lock.json && npm install --include=optional

# Copy source and build
COPY . .
RUN npm run build
# Output is now in /app/dist

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS final

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder stage into the nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Fix permissions — nginx runs as the 'nginx' user (uid 101)
# Directories need execute (755), files need read (644)
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && find /usr/share/nginx/html -type d -exec chmod 755 {} \; \
    && find /usr/share/nginx/html -type f -exec chmod 644 {} \;

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]