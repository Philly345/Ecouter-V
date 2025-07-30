# Use the official Node.js runtime as the parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment variable for Next.js
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
