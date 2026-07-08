FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Install frontend dependencies and build static export
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy backend source
COPY backend/src/ ./backend/src/

# Expose port (Render sets PORT env var)
EXPOSE 5000

# Start the unified server
CMD ["node", "backend/src/index.js"]
