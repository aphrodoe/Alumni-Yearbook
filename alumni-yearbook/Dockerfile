# Build Stage
FROM node:18-alpine AS builder

# Install dependencies required for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci

# Copy source files and build the application
COPY . .
RUN npm run build

# Production Stage
FROM node:18-alpine

# Install runtime dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "start"]
