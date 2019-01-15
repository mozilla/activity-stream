/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

function discoveryStreamRenderLayout(DiscoveryStream) {
  if (!DiscoveryStream.spocs.loaded || !DiscoveryStream.spocs.data.length) {
    return DiscoveryStream;
  }

  let spocIndex = 0;

  // Quick hack for a deep copy, can improve later.
  DiscoveryStream.layoutRendered = JSON.parse(JSON.stringify(DiscoveryStream.layout));

  for (let row of DiscoveryStream.layoutRendered) {
    for (let component of row.components) {
      if (component.spocs && DiscoveryStream.spocs.data[spocIndex]) {
        if (Math.random() <= component.spocs.probability) {
          component.spocs.result = DiscoveryStream.spocs.data[spocIndex++];
        }
      }
    }
  }

  return DiscoveryStream;
}

const EXPORTED_SYMBOLS = ["discoveryStreamRenderLayout"];
