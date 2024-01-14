import { parse } from 'url';
import { Socket } from 'net';
import { createServer } from 'http';

import app, { isBlacklisted } from "./proxy.js";
import { info, error } from "./logger.js";
const server = createServer(app);

server.on('connect', (req, socket, head) => {
  try {
    let endPoint = parse(`http://${req.url}`);

    if(isBlacklisted(endPoint.hostname)) {
      console.log("Blocking...", endPoint.hostname);
      socket.write("HTTP/1.1" + " 500 Connection Gone\r\n\r\n");
      return;
    }

    let proxySocket = new Socket();
    proxySocket.connect(endPoint.port, endPoint.hostname, () => {
      info("Connected to ", endPoint.hostname);
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
      error(err);
    });

    socket.on('error', (err) => {
      error(err);
    });
  } catch(err) {
    error(err);
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
	info("Listening http at port " + (process.env.PORT || 5000));
});
