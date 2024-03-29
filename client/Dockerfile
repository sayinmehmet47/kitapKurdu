FROM node:latest
WORKDIR /app
COPY package.json .
RUN npm install -g bun
RUN npm install
COPY . .

CMD ["npm", "run" , "start"]
