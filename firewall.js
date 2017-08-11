var MITMServer = require('mitm-server')
var https = require('https')
var http = require('http')
var url = require('url')
 
var options = {
  certDir: './cert-cache',
  caCertPath: './certs/cacert.pem',
  caKeyPath: './certs/cakey.pem'
}
 
var server = new MITMServer(options, handler)
 
server.listen(8000)
 
function handler (req, res, secure) {
  var module = secure ? https : http
  var port = req.headers.host.split(':')[1]
  var reqOptions = {
    method: req.method,
    port: port ? parseInt(port, 10) : secure ? 443 : 80,
    hostname: req.headers.host.split(':')[0],
    headers: req.headers,
    path: url.parse(req.url).path
  }
  console.log(reqOptions);
 
  req.pipe(module.request(reqOptions, onResponse))
 
  function onResponse (response) {
    res.writeHead(response.statusCode, response.headers)
    response.pipe(res)
  }
}