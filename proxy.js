const url = require('url');
const helmet = require('helmet');
const qs = require('querystring');
const express = require('express');
const httpProxy = require('http-proxy');

const app  = express();
const LOG = require("./logger");

const proxy = httpProxy.createProxyServer();
app.use(helmet()); // for setting so many default headers.

const logger = (url, headers, query, body) => {
  LOG.info({
    url,
    headers,
    query,
    body
  });
}

const proxier = (req, res, _url) => {
  let target = url.parse(_url);
  proxy.web(req, res, { target: target.protocol + '//' + target.host }, function(error) {
    LOG.error(error);
    res.status(500).send(error);
  });
}

app.use('/ping', function(req, res) {
  res.send('pong');
});

app.use('/', function(req, res, next) {
  let body = "";

  req.on('data', function (data) {
    body += data;
  });

  req.on('end', function () {
    let post = qs.parse(body);
    logger(req.url, req.headers, req.query, post);
  });
  proxier(req, res, req.headers["x-custom-url"] || req.url);
});

module.exports = app;