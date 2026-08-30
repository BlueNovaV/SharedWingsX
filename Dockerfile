FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY protocol ./protocol
COPY relay ./relay
RUN npm ci --omit=dev --workspace=@twinseat/protocol --workspace=@twinseat/relay && npm run build -w @twinseat/protocol && npm run build -w @twinseat/relay
ENV PORT=17320
EXPOSE 17320
CMD ["node", "relay/dist/index.js"]
