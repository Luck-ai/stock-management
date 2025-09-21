FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx next telemetry disable
RUN npm run build

CMD ["npm", "run", "start"]
