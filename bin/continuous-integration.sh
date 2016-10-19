#!/bin/sh

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

if [ -z "$CONTINUOUS_INTEGRATION" ]
then
    set -x # sets bash debugging mode
    echo "setting up development virtualenv"
    export CFLAGS='-std=c99'
fi

fab deploy:destination=$1 || exit 1
