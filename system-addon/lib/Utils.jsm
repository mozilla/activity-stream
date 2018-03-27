/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");

// Keep a hasher for repeated hashings
let gCryptoHash = null;

/**
 * Run some text through md5 and return the base64 result.
 */
function md5Hash(text) {
  // Lazily create a reusable hasher
  if (gCryptoHash === null) {
    gCryptoHash = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
  }

  gCryptoHash.init(gCryptoHash.MD5);

  // Convert the text to a byte array for hashing
  gCryptoHash.update(text.split("").map(c => c.charCodeAt(0)), text.length);

  // Request the has result as ASCII base64
  return gCryptoHash.finish(true);
}

/**
 * Reset the MD5 hasher, a helper function mostly used in the unit test.
 */
function resetMD5Hasher() {
  gCryptoHash = null;
}

const EXPORTED_SYMBOLS = ["md5Hash", "resetMD5Hasher"];
