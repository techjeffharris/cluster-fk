
var cluster = require('cluster'),
    http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');

console.log('Server %s running at http://127.0.0.1:1337/', cluster.worker.id);

process.send({
    memoryUsage: process.memoryUsage().heapTotal,
    ready: true
});