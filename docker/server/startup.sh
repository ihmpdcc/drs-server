#!/bin/bash

pushd /src >/dev/null

# Check if the node_modules directory, that contains the libraries
# and dependencies is present. If not, run `npm install`.
if [ ! -d node_modules ]; then
    echo "----------------------------------------"
    echo "No node_modules directory installed. Installing dependencies now."
    echo "----------------------------------------"
    npm install
fi

node drs.js --config ./conf/config-docker.ini
