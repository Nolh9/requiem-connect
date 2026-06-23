FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN apk add --no-cache python3 make g++ && npm install --omit=dev
COPY backend ./backend
COPY frontend ./frontend
WORKDIR /app/backend
EXPOSE 3000
CMD ["npm", "start"]
