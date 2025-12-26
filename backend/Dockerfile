FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Note: Prisma schema is mounted from shared location in docker-compose
# Generate Prisma Client (schema will be available via volume mount)
RUN npx prisma generate --schema=./prisma/schema.prisma || echo "Schema will be available at runtime"

EXPOSE 3001

CMD ["npm", "run", "dev"]

