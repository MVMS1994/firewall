import url from 'url';
import helmet from 'helmet';
import qs from 'querystring';
import express from 'express';
import httpProxy from 'http-proxy';
import LOG from "./logger.js";

const app = express();
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

var blocked = [];
export var isBlacklisted = function(_url) {
  var shouldBlock = false;

  blocked.forEach((item) => {
    var res = _url.match(new RegExp(item));
    if(res) {
      shouldBlock = true;
    }
  });
  return shouldBlock;
};

const proxier = (req, res, _url) => {
  let target = url.parse(_url);
  proxy.web(req, res, { target: target.protocol + '//' + target.host }, function(error) {
    LOG.error(error);
    res.status(500).send(error);
  });
}

app.use('/unblock', function(req, res) {
  blocked = blocked.filter((item) => new String(item) != req.query.item);
  res.send("OK");
});

app.use('/favicon.ico', function(req, res) {
  res.sendStatus(200);
})

app.use('/block', function(req, res) {
  blocked = blocked.concat(JSON.parse(req.query.list));
  res.send("OK");
});

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

  if (isBlacklisted(req.url)) {
    console.log("Blocking...", req.url);
    res.sendStatus(500);
  } else {
    proxier(req, res, req.headers["x-custom-url"] || req.url);
  }
});

export default app;