#!/bin/bash

set -e

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
