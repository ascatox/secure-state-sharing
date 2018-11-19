FROM node:8

# Create app directory
RUN mkdir -p /usr/src/app
COPY ./app /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY ./app/package.json /usr/src/app/

RUN npm install --production

# Copy app source
#COPY src /usr/src/app/

# Remove dev dependencies
RUN npm prune --production

# Expose port and CMD
EXPOSE 3026
CMD [ "node", "server.js" ]