"use strict";

const connect = require("connect");
const http = require("http");
const query = require("connect-query");
const cors = require("cors");
const request = require("request");
const yaml = require("yamljs");

const API_URL = "https://api.embedly.com/1/extract";

let config = yaml.load("config.default.yml");
try {
  // Load user config if it exists
  config = Object.assign({}, config, yaml.load("config.yml"));

} catch (e) {
  //
}

if (!config.API_KEY) {
  const message = `

===============================================================
WARNING: No API_KEY found in config.yml
===============================================================
If you want to see enhanced data, you must ask nchapman for the key.
The README has more information about how to change configuration.
We are working on deploying a dev server so you won't have to do this.
Sorry!


`;
  console.log(message); // eslint-disable-line no-console
  process.exit(0);
}
console.log(config); // eslint-disable-line no-console

const app = connect();
app.use(cors());
app.use(query());

app.use("/extract", function(req, res) {
  let qs = `?key=${config.API_KEY}`;
  if (req.query.urls) {
    qs += `&urls=${req.query.urls.map(encodeURIComponent).join(",")}`;
  } else if (req.query.url) {
    qs += `&url=${encodeURIComponent(req.query.url)}`;
  }

  res.setHeader("Content-Type", "application/json");
  request({uri: API_URL + qs}, function(err, response) {
    if (response.statusCode >= 400) {
      return res.end(JSON.stringify(response));
    }
    res.end(response.body);
  });
});

//create node.js http server and listen on port
http.createServer(app).listen(1467);
console.log("server running at 1467"); // eslint-disable-line no-console
