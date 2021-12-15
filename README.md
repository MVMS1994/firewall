# Firewall
A simple node js forward proxy server.

### Pre-requisite
 - Create a cert file like this
 ```
 mkdir -p cert
 openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./cert/proxy.key -out ./cert/proxy.crt
 ```

### Running the server
    npm i
    node run dev
