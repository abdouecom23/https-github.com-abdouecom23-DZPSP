# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configuration files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build both the React frontend and the Express backend
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package configuration
COPY package*.json ./

# Install only production dependencies to keep the image minimal and secure
RUN npm ci --only=production

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist
# Note: JSON database file storage at /app/data should be mounted as a persistent volume in production
RUN mkdir -p /app/data

# Expose port 3000 as per system requirements
EXPOSE 3000

# Run the bundled Express backend
CMD ["npm", "run", "start"]
