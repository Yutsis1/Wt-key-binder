FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY shared ./shared
COPY files/jetfighter.blk ./files/jetfighter.blk
USER node
EXPOSE 3001
CMD ["node", "server/index.ts"]
