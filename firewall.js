var url = require('url');
var net = require('net');
var http = require('http');
var Redis = require('redis');
var helmet = require('helmet');
var qs = require('querystring');
var express = require('express');
var request = require('request');
var bluebird = require('bluebird');
var httpProxy = require('http-proxy');

var app  = express();
var redis = bluebird.promisifyAll(Redis.createClient());
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

var isBlacklisted = async function(url) {
  var shouldBlock = false;
  var blocked = JSON.parse(await (redis.getAsync('blackListed'))) || [];
  
  blocked.forEach((item, index) => {
    var res = url.match(new RegExp(item));
    if(res) { 
      shouldBlock = true;
    }
  });
  return shouldBlock;
};

app.use('/unblock', function(req, res) {  
  redis.get('blackListed', function(err, reply) {
    var list = JSON.parse(reply) || [];
    list = list.filter((item) => {return (new String(item) != req.query.item);});
    redis.set('blackListed', JSON.stringify(list), function(err, reply) {
      res.send({
        error: err,
        reply: reply
      });
    }); 
  });
});

app.use('/favicon.ico', function(req, res) {
  res.sendStatus(200);
})

app.use('/block', function(req, res) {
  redis.get('blackListed', function(err, reply) {
    var list = JSON.parse(reply) || [];
    list = list.concat(JSON.parse(req.query.list));
    redis.set('blackListed', JSON.stringify(list), function(err, reply) {
      res.send({
        error: err,
        reply: reply
      }); 
    });
  });
});

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

