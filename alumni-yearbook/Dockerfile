# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies required for node-gyp and canvas
RUN apk add --no-cache python3 make g++ build-base cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev pangomm-dev libjpeg-turbo-dev freetype-dev

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install runtime dependencies for canvas
RUN apk add --no-cache cairo jpeg pango giflib pixman pangomm libjpeg-turbo freetype

# Copy only necessary files from builder
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Set environment to production
ENV NODE_ENV production

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]