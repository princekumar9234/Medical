FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Expose default port (Railway dynamically injects PORT)
EXPOSE 5000

# Start application
CMD ["npm", "start"]
