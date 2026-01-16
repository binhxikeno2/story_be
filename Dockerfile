FROM node:18-alpine
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
RUN mkdir -p logs/info logs/error

# Expose port
EXPOSE 3003

# Run production build
CMD ["yarn", "run", "start:prod"]