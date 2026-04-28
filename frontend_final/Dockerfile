# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Angular application
RUN npm run build

# Stage 2: Serve the application with SSR
FROM node:20-alpine

WORKDIR /app

# Copy the built output from the previous stage
COPY --from=build /app/dist/frontend_final ./dist/frontend_final

# Expose the port the app runs on (4000 by default for Angular SSR)
EXPOSE 4000

# Set Node environment to production
ENV NODE_ENV=production

# Start the SSR server
CMD ["node", "dist/frontend_final/server/server.mjs"]
