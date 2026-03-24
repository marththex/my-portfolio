# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

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

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]