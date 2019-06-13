#!/bin/bash

set -e

echo Installing dependencies
npm run dep

uname -a
nvim --version
./node_modules/.bin/tsc --version
./node_modules/.bin/browserify --version
./node_modules/.bin/mocha --version
./node_modules/.bin/electron --version
