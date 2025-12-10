FROM node:18-alpine
WORKDIR /src
COPY . .
RUN yarn install
EXPOSE 8080
CMD ["yarn", "run", "start"]