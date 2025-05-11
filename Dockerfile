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
RUN npx prisma generate

# Build the application (if necessary for a NestJS app)
RUN npm run build

# Expose the port the app will run on
EXPOSE 8005

# Run the application
CMD ["npm", "run", "start:prod"]