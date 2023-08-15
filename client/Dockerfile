FROM --platform=linux/amd64 node:20
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

CMD ["npm", "run" , "start"]
