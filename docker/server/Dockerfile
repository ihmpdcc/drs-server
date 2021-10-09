# Download base image ubuntu 20.04
FROM ubuntu:20.04

# Labels about the image
LABEL maintainer="igs-info@som.umaryland.edu"
LABEL version="0.1"
LABEL description="This is Docker image for the HMP DRS API."

# Disable Prompt During Packages Installation
ARG DEBIAN_FRONTEND=noninteractive

# Update Ubuntu Software repository
RUN apt-get update -y

# install curl 
RUN apt-get install -y curl

# Run the installation script
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash

# Install nodejs from the ubuntu repositories
RUN apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

RUN mkdir /src

WORKDIR /src

EXPOSE 9999

ENV NODE_PATH=.:./lib

CMD [ "node", "drs.js", "--conf", "./conf/config-docker.ini" ]
