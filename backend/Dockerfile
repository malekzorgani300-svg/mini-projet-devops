FROM node:20-alpine

WORKDIR /app

# Installer d'abord les dépendances pour profiter du cache Docker
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

USER node
CMD ["node", "server.js"]
