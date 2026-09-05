FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including Prisma CLI
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

EXPOSE 4000

# Wait for Postgres and push migrations, then start server
CMD ["sh", "-c", "npx prisma db push && node dist/src/index.js"]
