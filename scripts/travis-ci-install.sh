#!/bin/bash

set -e

echo Installing dependencies
if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
    sudo add-apt-repository --yes ppa:neovim-ppa/unstable
    sudo apt-get -qq update
    sudo apt-get install -y neovim libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
    export DISPLAY=':99.0'
    sh -e /etc/init.d/xvfb start
elif [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
    brew update
    HOMEBREW_NO_AUTO_UPDATE=1 brew install neovim pkg-config cairo pango libpng giflib jpeg
else
    echo "Unknown platform: ${TRAVIS_OS_NAME}"
    exit 1
fi

npm run dep

uname -a
nvim --version
./node_modules/.bin/tsc --version
./node_modules/.bin/browserify --version
./node_modules/.bin/mocha --version
./node_modules/.bin/electron --version

echo 'Building package'
npm run build
npm run lint

echo 'Running unit tests'
npm run test

echo 'Running E2E tests'
if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
    # E2E tests fail on Linux worker because of Hardware Acceleration.
    # It may work with the environment HA is disabled. But it does not make sense to run tests
    # without HA because most users enable HA usually.
    npm run e2e
fi
