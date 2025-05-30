FROM node:bullseye-slim

WORKDIR /workspace
COPY ./frontend ./
RUN npm config set registry https://registry.npm.taobao.org && npm install

CMD ["npm", "run", "start"]