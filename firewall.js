var url = require('url');
var net = require('net');
var http = require('http');
var helmet = require('helmet');
var qs = require('querystring');
var express = require('express');
var request = require('request');
var httpProxy = require('http-proxy');
var util = require('util');

var app  = express();
var server = http.createServer(app);
var proxy = httpProxy.createProxyServer();
app.use(helmet());

logger = (url, headers, query, body) => {
	console.log("/-----------------------------------------------/");
	console.log(url);
	console.log(headers);
	console.log(query);
	console.log(body);
	console.log("/-----------------------------------------------/");
}

proxier = (req, res) => {
	var target = url.parse(req.url);
	if(!req.secure) {
		var result = proxy.web(req, res, 
		{ target: target.protocol + '//' + target.host }, 
		function(error) {
			console.log(error);
			res.status(500).send(error);
		});
	} else {
		var result = proxys.web(req, res, 
		{ target: target.protocol + '//' + target.host }, 
		function(error) {
			console.log(error);
			res.status(500).send(error);
		});
	}
}

async function isBlacklisted(url) {
  return false;
}

app.use('/favicon.ico', function(req, res) {
  res.sendStatus(200);
})

app.use('/', function(req, res, next) {
  var body = "";
  
  req.on('data', function (data) {
    body += data;
	});

	req.on('end', function () {
    var post = qs.parse(body);
		logger(req.url, req.headers, req.query, post);
	});
  isBlacklisted(req.url)
  .then(function(result) {
    if(result) {
      console.log("Blocking....")
      res.sendStatus(500);
    } else {
      proxier(req, res);
    }
  })
  .catch(function(err) {
    console.log(err);
  });
});


server.on('connect', (req, socket, head) => {
  try {
    var endPoint = url.parse(`http://${req.url}`);
    var httpVersion = request['httpVersion'];
    
    isBlacklisted(endPoint.hostname)
    .then(function(result) {
      if(result) {
        console.log("Blocking ", endPoint.hostname);
        socket.write("HTTP/1.1" + " 500 Connection Gone\r\n\r\n");
        return;
      }
      var proxySocket = new net.Socket();
      proxySocket.connect(endPoint.port, endPoint.hostname, () => {
        console.log("Connected to ", endPoint.hostname);
        proxySocket.write(head);
        socket.write("HTTP/1.1" + " 200 Connection established\r\n\r\n");
        proxySocket.pipe(socket);
        socket.pipe(proxySocket);
      });

      proxySocket.on('data', (chunk) => {
        // console.log('data length = %d', chunk.length);
      });

      socket.on('data', (chunk) => {
        // console.log('data length = %d', chunk.length);
      });

      proxySocket.on('error', (err) => {
        console.log(err);
      });

      socket.on('error', (err) => {
        console.log(err);
      }); 
    })
    .catch(function(err) {
      console.log(err);
    });

  } catch(err) {
    console.log(err);
  }
});

server.on('upgrade', (req, socket, head) => {
  socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: WebSocket\r\n' +
               'Connection: Upgrade\r\n' +
               '\r\n');
  socket.pipe(socket);
});


server.listen(5000, function() {
	console.log("Listening http at port " + 5000);
});

