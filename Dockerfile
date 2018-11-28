FROM node:11.2.0-alpine

WORKDIR .

COPY package.json ./
COPY powcoin/pow_syndacoin.js ./powcoin/
COPY ./identities.js ./
RUN npm install

COPY . .

EXPOSE 10000

CMD ["npm", "start"]
