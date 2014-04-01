cluster-fuck
============

A simple, elegant cluster forker with TCP-based [REPL](https://github.com/techjeffharris/prepl).

## Usage

```javascript
var ClusterFuck = require('cluster-fuck'),
    cluster;
    
cluster = new ClusterFuck({
    exec: "mySpecialWorker.js",
    args: ['--my', '--arguments'],
    silent: false,
    workers: 8
});

cluster.start();
```

When workers are ready, they must send a `ready` signal and their memory usage:

```javascript
var server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
});

server.on('listening', function () {
    process.send({
        memoryUsage: process.memoryUsage(),
        ready: true
    });
});

server.listen(1337, '127.0.0.1');
```

^C quits gracefully; however, you may connect to the [REPL](https://github.com/techjeffharris/prepl) to further control the cluster using nc:

    $ nc -U prepl.sock
    > help
            COMMAND         DESCRIPTION
            help            Display this help message
            exit            Disconnect from REPL
            status          Display the status of the Cluster
            memory          Display detailed memory information.
            start           Start the cluster
            restart         Restart all workers gracefully
            stop            Stop all workers gracefully
            kill            Kill all workers immediately
            shutdown        Stop all workers gracefully, then shutdown the cluster.
    > 

or another node app:

```javascript
var net = require('net');
var client = net.connect({path: 'prepl.sock'}), function() {
  console.log('connected!');
});

client.on('data', function(data) {
  console.log(data.toString());
});

replClient.on('error', function (err) {
    console.log(err);
})

var commands = [
    'help\n',
    'kill\n',
    'status\n',
    'start\n', 
    'status\n'
];

for (var i = 0; i < commands.length; i++) {
    (function (command) {
        setTimeout(function() {
            replClient.write(command);
        }, i*2000);
    }(commands[i]));
}
```

which would output something similar to: 

    connected!
    >       COMMAND     DESCRIPTION
            help            Display this help message
            exit            Disconnect from REPL
            status          Display the status of the Cluster
            memory          Display detailed memory information.
            start           Start the cluster
            restart         Restart all workers gracefully
            stop            Stop all workers gracefully
            kill            Kill all workers immediately
            shutdown        Stop all workers gracefully, then shutdown the cluster.
    > 
    > 
            State:          stopped
            Ready Workers:  0
            Memory:         15.421875 MB
    > 
    > 
            State:          ready
            Ready Workers:  7
            Memory:         300.91015625 MB
    > 

## Configuration
Default configuration:
```json
{
    "args": [],
    "exec": "server.js",
    "silent": true,
    "shutdownTimeout": 5000,
    "workers": 1
}
```
### Options
* `args`: see [cluster](http://nodejs.org/api/cluster.html).[setupMaster([settings])](http://nodejs.org/api/cluster.html#cluster_cluster_setupmaster_settings)
* `exec`: see [cluster](http://nodejs.org/api/cluster.html).[setupMaster([settings])](http://nodejs.org/api/cluster.html#cluster_cluster_setupmaster_settings)
* `silent`: see [cluster](http://nodejs.org/api/cluster.html).[setupMaster([settings])](http://nodejs.org/api/cluster.html#cluster_cluster_setupmaster_settings)
* `prepl`: see [prepl](https://github.com/techjeffharris/prepl) [configuration](https://github.com/techjeffharris/prepl#configuration)
* `shutdownTimeout`: period in ms to wait for workers to shutdown. Default `5000`
* `workers`: the number of workers to fork. Default: `1`

## API

### ClusterFuck
Exposed by `require('cluster-fuck')`.

### ClusterFuck()
Creates a new `ClusterFuck`.  Works with and without `new`:

```javascript
var ClusterFuck = require('cluster-fuck')();
  // or
var ClusterFuck = require('cluster-fuck');
var myCluster = new ClusterFuck();
```

### ClusterFuck.start()
Starts the cluster:

```javascript
myCluster.start();
```

### ClusterFuck.shutdown([done:Function])
* done `function`: function to be called when the cluster has shutdown

Used to stop all workers and shutdown the cluster:

```javascript
myCluster.shutdown(function () {
    console.log('cluster shutdown!');
})
```

### ClusterFuck.memoryUsage([unit: String])
* unit `function`: if specified, this function returns the total memory formatted in `unit`s. 

Returns the total memory usage for each process

```javascript
var memory = myCluster.memoryUsage();
//{ cluster: { rss: 308719616, heapUsed: 17281008, heapTotal: 34354176 },
//  master: { rss: 15187968, heapTotal: 10456064, heapUsed: 4650712 },
//  workers: 
//   { '1': { rss: 43851776, heapTotal: 34354176, heapUsed: 19252248 },
//     '2': { rss: 41627648, heapTotal: 34354176, heapUsed: 16673376 },
//     '3': { rss: 41598976, heapTotal: 34354176, heapUsed: 17105496 },
//     '4': { rss: 41418752, heapTotal: 34354176, heapUsed: 16969800 },
//     '5': { rss: 41639936, heapTotal: 34354176, heapUsed: 16935840 },
//     '6': { rss: 41676800, heapTotal: 34354176, heapUsed: 17133768 },
//     '7': { rss: 41717760, heapTotal: 34354176, heapUsed: 17281008 } },
//  workerTotal: 293531648 }

// or
var memory = myCluster.memoryUsage('MB');
// 294.11328125 MB
```

_note: `unit` must be a valid unit in [techjeffharris-utils](https://github.com/techjeffharris/utils)_.

## Events
In addtion to all events inherited from [cluster](http://nodejs.org/api/cluster.html), ClusterFuck exposes the following events:

### Event: 'starting'
Emitted before the cluster starts all workers:

```javascript
myCluster.on('starting', function () {
    console.log('starting cluster...');
});
```

### Event: 'ready'
Emitted when all workers are ready:

```javascript
myCluster.on('ready', function () {
    console.log('the cluster is ready!');
});
```

### Event: 'restarting'
Emitted before the cluster restarts all workers:

```javascript
myCluster.on('restarting', function () {
    console.log('restarting cluster...');
});
```

### Event 'restarted'
Emitted when all workers are ready after a restart:

```javascript
myCluster.on('restarted', function () {
    console.log('cluster has restarted!');
});
```

### Event: 'shuttingDown'
Emitted when the cluster starts shutting down.

```javascript
myCluster.on('shuttingDown', function () {
    console.log('shutting down cluster...');
});
```

### Event: 'shutdown'
Emitted when the cluster has shut down.

```javascript
myCluster.on('shutdown', function () {
    console.log('cluster has shutdown!');
});
```

### Event: 'stopping'
Emitted before the cluster stops all workers:

```javascript
myCluster.on('stopping', function () {
    console.log('stopping cluster...');
});
```

### Event: 'stopped'
Emitted when all workers have stopped:

```javascript
myCluster.on('stopped', function () {
    console.log('cluster has stopped!');
});
```

### Event 'killing'
Emitted before the cluster kills all workers:

```javascript
myCluster.on('killing', function () {
    console.log('killing cluster...');
});
```
### Event: 'killed'
Emitted when all workers have been killed:

```javascript
myCluster.on('killed', function () {
    console.log('cluster has been killed!');
});
```
