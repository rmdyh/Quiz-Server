FROM node:bullseye-slim

WORKDIR /workspace
COPY ./frontend ./
RUN npm install

CMD ["npm", "run", "start"]