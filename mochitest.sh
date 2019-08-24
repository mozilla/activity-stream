#!/bin/bash

export SHELL=/bin/bash
export TASKCLUSTER_ROOT_URL="https://taskcluster.net"
# Display required for `browser_parsable_css` tests
export DISPLAY=:99.0
/sbin/start-stop-daemon --start --quiet --pidfile /tmp/custom_xvfb_99.pid --make-pidfile --background --exec /usr/bin/Xvfb -- :99 -ac -screen 0 1280x1024x16 -extension RANDR

# Pull latest m-c and update tip
cd /mozilla-central && hg pull && hg update -C

# Build Activity Stream and copy the output to m-c
cd /activity-stream && npm install . && npm run buildmc

# Build latest m-c with Activity Stream changes
cd /mozilla-central && rm -rf ./objdir-frontend && ./mach build \
  && RUN_FIND_DUPES=1 ./mach package \
  && ./mach test --appname=dist startup_mainthreadio
