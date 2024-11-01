# DOCKER_BUILDKIT=1 docker build -t chat-app -f ./Dockerfile


# Stage 1: Build Node server and React client
FROM node:22 AS build-stage

# Set up the server
WORKDIR /app/server
COPY ./server/package*.json ./
RUN npm install
COPY ./server .

# Set up the client
WORKDIR /app/client
COPY ./client/package*.json ./
RUN npm install
COPY ./client .

# Build the client
RUN npm run build

# Stage 2: Prepare Node server with production dependencies
FROM node:22-alpine AS server-stage

# Set working directory for the server
WORKDIR /app/server

# Copy server files from the build stage
COPY --from=build-stage /app/server .

# Copy client build output to the server's public directory
COPY --from=build-stage /app/client/dist /app/server/public

# Install production dependencies for the server
RUN npm install --only=production
RUN npx prisma generate

# Expose the Node server port
EXPOSE 5000

# Start the Node server in the background
CMD ["npm", "run", "server"] &


# Stage 3: Nginx to serve client and route API/WebSocket requests
FROM nginx:alpine

# Copy client static files to Nginx HTML folder
COPY --from=build-stage /app/client/dist /usr/share/nginx/html

# Copy a custom Nginx config for routing
COPY ./nginx.conf /etc/nginx/nginx.conf

# Expose Nginx port
EXPOSE 3000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

