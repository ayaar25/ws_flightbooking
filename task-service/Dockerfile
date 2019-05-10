FROM node:10.9.0-slim
WORKDIR /task-service
ADD . /task-service
RUN npm install
EXPOSE 3000

CMD ["npm", "start"]