const url = require('url');
const net = require('net');
const http = require('http');
const helmet = require('helmet');
const qs = require('querystring');
const express = require('express');
const httpProxy = require('http-proxy');

const app  = express();
const server = http.createServer(app);
const LOG = require("./logger");

const proxy = httpProxy.createProxyServer();
app.use(helmet()); // for setting so many default headers.

const logger = (url, headers, query, body) => {
	LOG.info("/-----------------------------------------------/");
	LOG.info(url);
	LOG.info(headers);
	LOG.info(query);
	LOG.info(body);
	LOG.info("/-----------------------------------------------/");
}

const proxier = (req, res) => {
	let target = url.parse(req.url);
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
  proxier(req, res);
});


server.on('connect', (req, socket, head) => {
  try {
    let endPoint = url.parse(`http://${req.url}`);

    let proxySocket = new net.Socket();
    proxySocket.connect(endPoint.port, endPoint.hostname, () => {
      LOG.info("Connected to ", endPoint.hostname);
      proxySocket.write(head);
      socket.write("HTTP/1.1" + " 200 Connection established\r\n\r\n");
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    // proxySocket.on('data', (chunk) => {
    //   // LOG.info('data length = %d', chunk.length);
    // });
    //
    // socket.on('data', (chunk) => {
    //   // LOG.info('data length = %d', chunk.length);
    // });

    proxySocket.on('error', (err) => {
      LOG.error(err);
    });

    socket.on('error', (err) => {
      LOG.error(err);
    });
  } catch(err) {
    LOG.error(err);
  }
});

server.on('upgrade', (req, socket, head) => {
  socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
     'Upgrade: WebSocket\r\n' +
     'Connection: Upgrade\r\n' +
     '\r\n'
  );
  socket.pipe(socket);
});


server.listen(5000, function() {
	LOG.info("Listening http at port " + 5000);
});
