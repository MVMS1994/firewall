# syntax=docker/dockerfile:1
FROM node:18-alpine
# RUN apk add --no-cache g++ make
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "firewall.js"]
