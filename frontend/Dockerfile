FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Build Next.js production bundle
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
CMD ["npm", "start"]
