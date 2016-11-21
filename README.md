# Firewall
A node js forward proxy server that not only just proxies, but also provides you features to protect yourselves from trackers.

### Pre-requisite
 - Redis server should be installed and running. Download redis from [here](http://redis.io/download)

### Running the server
    npm i
    node firewall.js

### Usage
1. To block a site/url
    - localhost:5000/block?list=["abc.com","regex.of.path"]
2. To unblock a site/url
    - localhost:5000/unblock?item="abc.com"
    
