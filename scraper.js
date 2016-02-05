const ogs = require("open-graph-scraper");
const connect = require("connect");
const http = require("http");
const query = require("connect-query");
const cors = require("cors");

function getData(url) {
  return new Promise((resolve) => {
    ogs({url}, function (err, results) {
      console.log(url);
      console.log(results);
      if (err) return resolve({url, data: results});
    	resolve({url, data: results.data});
    });
  });
}

const app = connect();
app.use(cors());
app.use(query());

app.use('/og', function (req, res) {
  const urls = req.query.urls;
  console.log(req.query);
  if (!urls) return res.end('No urls sent\n');
  res.setHeader('Content-Type', 'application/json');
  Promise.all(urls.map(getData))
    .then(json => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(json));
    });
});

//create node.js http server and listen on port
http.createServer(app).listen(1467);
