FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose the port Smithery expects
EXPOSE 3000

# Run the server in HTTP mode
CMD ["node", "src/ai-accountability-server.js", "--http"] 