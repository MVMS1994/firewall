const url = require('url');
const net = require('net');
const http = require('http');

const app = require("./proxy");
const LOG = require("./logger");
const server = http.createServer(app);

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


server.listen(process.env.PORT || 5000, function() {
	LOG.info("Listening http at port " + process.env.PORT || 5000);
});
