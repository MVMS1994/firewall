const fs = require('fs');
const net = require('net');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const OPENSSL = process.env.OPENSSL === "true";
const options = {
  key: fs.readFileSync('./cert/proxy.key'),
  cert: fs.readFileSync('./cert/proxy.crt')
};

const app = require("./proxy");
const ok = require("./ok");
const LOG = require("./logger");
const server = http.createServer(app);
const httpsServer = https.createServer(options, app);
const oksServer = https.createServer(options, ok);

const getServerEndPoint = (req) => {
  if(OPENSSL) {
    return new URL(`http://localhost:5050`);
  } else {
    // noinspection HttpUrlsUsage
    return new URL(`http://${req.url}`);
  }
}

server.on('connect', (req, socket, head) => {
  try {
    let endPoint = getServerEndPoint(req);

    if(endPoint.hostname === "kinesis.us-west-2.amazonaws.com"
      || endPoint.hostname === "kinesis.us-east-1.amazonaws.com"
    ) {
      endPoint = new URL("http://localhost:5051");
    } else if(endPoint.hostname === "academy.amazon.in") {
      // endPoint = new URL("http://academy-gamma.amazon.in:443")
    }

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
      LOG.error("server:", err);
    });

    socket.on('error', (err) => {
      LOG.error("client:", err);
    });
  } catch(err) {
    LOG.error("firewall:", err);
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
httpsServer.listen(5050, () => {
  LOG.info("Listening https at port " + 5050);
});
oksServer.listen(5051, () => {
  LOG.info("Listening ok https at port " + 5051);
})
