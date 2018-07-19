#!/bin/bash

export SHELL=/bin/bash

# Pull latest m-c and update tip
cd /mozilla-central && hg pull && hg update -C

# Build Activity Stream and copy the output to m-c
cd /activity-stream && npm run buildmc

# Build latest m-c with Activity Stream changes
cd /mozilla-central && ./mach build  

# Run the mochitests
cd /activity-stream && npm run mochitest
