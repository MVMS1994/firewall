const lambdaProxy = require('http-lambda-proxy')
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const AWS = require('aws-sdk')

const app = express();
app.use(helmet()); // for setting so many default headers.
const server = http.createServer(app);

const LOG = require("./logger");
const proxy = lambdaProxy({
  target: "Firewall",
  credentials: new AWS.SharedIniFileCredentials({ profile: 'firewall' }),
  region: "ap-south-1"
})

app.use('/ping', function(req, res) {
  res.send('pong');
});

app.use('/', function(req, res) {
  req.headers["x-custom-url"] = req.url;
  proxy(req, res, req.url, {})
});

server.listen(5005, function() {
  LOG.info("Listening http at port " + 5005);
});
