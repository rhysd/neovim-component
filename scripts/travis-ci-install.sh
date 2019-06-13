#!/bin/bash

set -e

echo Installing dependencies
npm run dep

echo 'uname:'
uname -a

echo 'nvim:'
nvim --version
