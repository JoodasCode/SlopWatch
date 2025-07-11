FROM node:22-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with verbose logging
RUN npm ci --only=production --verbose

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port
EXPOSE 3000

# Health check with better error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))" || exit 1

# Run the streamable HTTP server with explicit error handling
CMD ["node", "src/streamable-http-server.js"] 