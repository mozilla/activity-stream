#! /usr/bin/env node
"use strict";

/* globals cd, cp, sed */
require("shelljs/global");

cd(process.argv[2]);

// Convert to install.rdf.in with substitutions
cp("install.rdf", "install.rdf.in");
sed("-i", /^(<RDF)/, "#filter substitution\n$1", "install.rdf.in");
sed("-i", /(<em:minVersion>).+(<\/em:minVersion>)/, "$1@MOZ_APP_VERSION@$2", "install.rdf.in");
sed("-i", /(<em:maxVersion>).+(<\/em:maxVersion>)/, "$1@MOZ_APP_MAXVERSION@$2", "install.rdf.in");
