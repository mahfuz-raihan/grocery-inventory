FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies cleanly
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all the frontend source code into the container
COPY . .

# Build the highly optimized production Next.js app
RUN npm run build

# Expose the standard Next.js port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]