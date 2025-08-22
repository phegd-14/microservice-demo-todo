# Use Node.js base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the source code
COPY . .

# Expose port (adjust if your service runs on a different port)
EXPOSE 4000

# Start the app
CMD ["npm", "start"]
