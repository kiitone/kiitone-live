# Use official Node.js image
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Cloud Run sets the PORT variable automatically, but we expose 8080 by default
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "backend/server.js"]