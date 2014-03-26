cluster-fuck
============

A simple, elegant cluster forker

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

When workers are ready, they must send a `ready` signal and their memory useage:

```javascript
var server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
});

server.on('listening', function () {
    process.send({
        memoryUsage: process.memoryUsage().heapTotal,
        ready: true
    });
});

server.listen(1337, '127.0.0.1');
```

## Configuration
Default configuration:
```json
{
    "args": [],
    "exec": "server.js",
    "silent": true,
    "workers": 1
}
```
### Options
* `args`: see [cluster](http://nodejs.org/api/cluster.html).[setupMaster([settings])](http://nodejs.org/api/cluster.html#cluster_cluster_setupmaster_settings)
* `exec`: see [cluster](http://nodejs.org/api/cluster.html).[setupMaster([settings])](http://nodejs.org/api/cluster.html#cluster_cluster_setupmaster_settings)
* `silent`: see [cluster](http://nodejs.org/api/cluster.html).[setupMaster([settings])](http://nodejs.org/api/cluster.html#cluster_cluster_setupmaster_settings)
* `prepl`: see [prepl](https://github.com/techjeffharris/prepl) [configuration](https://github.com/techjeffharris/prepl#configuration)
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
var cluster = new ClusterFuck();
```

### ClusterFuck.start()
Starts the cluster:

```javascript
cluster.start();
```

### ClusterFuck.shudown([done:Function])
* done `function` function to be called when the cluster has shutdown

Used to stop all workers and shutdown the cluster:

```javascript
cluster.stop(function () {
    console.log('cluster stopped!');
})
```

## Events

### Event: 'starting'
Emitted before the cluster starts all workers:

```javascript
cluster.on('starting', function () {
    console.log('starting cluster...');
});
```

### Event: 'ready'
Emitted when all workers are ready:

```javascript
cluster.on('ready', function () {
    console.log('the cluster is now ready!');
});
```

### Event: 'restarting'
Emitted before the cluster restarts all workers:

```javascript
cluster.on('restarting', function () {
    console.log('restarting cluster...');
});
```

### Event 'restarted'
Emitted when all workers are ready after a restart:

```javascript
cluster.on('restarted', function () {
    console.log('cluster restarted!');
});
```

### Event: 'stopping'
Emitted before the cluster stops all workers:

```javascript
cluster.on('stopping', function () {
    console.log('stopping cluster...');
});
```

### Event: 'stopped'
Emitted when all workers have stopped:

```javascript
cluster.on('stopped', function () {
    console.log('cluster stopped!');
});
```

### Event 'killing'
Emitted before the cluster kills all workers:

```javascript
cluster.on('killing', function () {
    console.log('killing cluster...');
});
```
### Event: 'killed'
Emitted when all workers have been killed:

```javascript
cluster.on('killed', function () {
    console.log('cluster killed!');
});
```
