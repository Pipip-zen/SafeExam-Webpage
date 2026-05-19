FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:20-bookworm-slim AS backend-runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=./backend/database/exam_proctoring.db
ENV UPLOAD_DIR=./uploads/evidence

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/backend/database /app/uploads/evidence

EXPOSE 5000

CMD ["node", "backend/server.js"]
