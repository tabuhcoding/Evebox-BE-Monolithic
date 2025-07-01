# Use an official Node.js runtime as a base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /src

# Copy package.json and package-lock.json (if available) to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables (ensure the .env file is in the working directory)
COPY .env .env

# Generate Prisma Client for Linux
# RUN npx prisma generate

# Build the application (if necessary for a NestJS app)
RUN npm run build

# Expose the port the app will run on
EXPOSE 8005

# Run the application
CMD ["npm", "run", "start:prod"]



#############################################################


# # Stage 1: Install dependencies and build
# FROM node:20-alpine AS builder

# # Install dependencies for native builds (like Prisma binary)
# RUN apk add --no-cache libc6-compat

# WORKDIR /app

# # Copy only the package files first for better layer caching
# COPY package*.json ./

# # Install only production dependencies (can be `npm ci` for exact versions)
# RUN npm install --frozen-lockfile

# # Copy the rest of the app
# COPY . .

# # Generate Prisma client for Alpine (Linux musl)
# RUN npx prisma generate

# # Build the NestJS application
# RUN npm run build

# # Remove dev dependencies to keep only prod
# RUN npm prune --production

# # Stage 2: Final minimal runtime
# FROM node:20-alpine

# # Set working directory
# WORKDIR /app

# # Install minimal runtime dependencies for Prisma (binary)
# RUN apk add --no-cache libc6-compat

# # Copy only necessary build artifacts and node_modules from builder
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/.env .env
# COPY --from=builder /app/package.json ./

# # Expose port
# EXPOSE 8005

# # Run the app
# CMD ["node", "dist/main"]


###########################################################

# # ---- Stage 1: Build ----
# FROM node:20-alpine AS builder

# WORKDIR /app

# COPY package*.json ./
# RUN npm ci --force

# COPY .env .env

# COPY . .
# RUN npx prisma generate
# RUN npm run build

# # ---- Stage 2: Production ----
# FROM node:20-alpine AS production

# WORKDIR /app

# ENV NODE_ENV=production

# COPY package*.json ./
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/.env .env

# EXPOSE 8005

# CMD ["node", "dist/main.js"]