FROM node:14
WORKDIR /app
COPY package.json .
RUN npm install -g bun
RUN npm install
COPY . .
