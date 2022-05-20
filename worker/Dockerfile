FROM node:gallium-buster

COPY package.json package.json
RUN yarn

COPY . .
RUN yarn build

FROM node:gallium-buster

WORKDIR /app

ENV NODE_ENV=production

COPY --from=0 package.json package.json
RUN yarn

COPY --from=0 dist .

EXPOSE 3001

CMD ["node", "index.js"]