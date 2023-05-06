FROM node:bullseye-slim

WORKDIR /workspace
COPY ./frontend/* /workspace/
RUN npm install

CMD ["npm", "run", "start"]