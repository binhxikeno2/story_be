FROM node:20-alpine

# Install yarn if not available
RUN apk add --no-cache yarn || npm install -g yarn

WORKDIR /src

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Create logs directory with proper permissions
RUN mkdir -p logs/info logs/error && \
    chmod -R 755 logs

# Expose port
EXPOSE 3003

# Run production build
# CMD ["node", "dist/main.js"]
CMD ["yarn", "run", "start:dev"]
