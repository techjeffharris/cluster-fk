
var cluster = require('cluster'),
    http = require('http');

var server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
});

server.on('listening', function () {

    // the first of the two will take 2 seconds, and the second 4
    var delay = (cluster.worker.id % 2) ? 2000 : 4000;

    setTimeout(function () {

        console.log('Server %s running at http://127.0.0.1:1337/', cluster.worker.id);

        process.send({
            memoryUsage: process.memoryUsage().heapTotal,
            ready: true
        });
    }, delay);
});

server.listen(1337, '127.0.0.1');
