# DOCKER_BUILDKIT=1 docker build -t chat-app -f ./Dockerfile

# Use a Node image to build both the client and server
FROM node:22 AS builder

# Set up server
WORKDIR /app/server
COPY ./server/package*.json ./
RUN npm install
COPY ./server .

# Set up client
WORKDIR /app/client
COPY ./client/package*.json ./
RUN npm install
COPY ./client .

# Build the client
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Copy server files
WORKDIR /app/server
COPY --from=builder /app/server .

# Copy client build output to the public directory of the server
COPY --from=builder /app/client/dist /app/server/public

# Install production dependencies
RUN npm install --only=production
RUN npx prisma generate

# Expose server port
EXPOSE 5000

# Start the Node server
CMD ["npm", "run", "server"]
