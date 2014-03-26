cluster-fuck
============

a simple, elegant cluster forker

# Use
```javascript
var ClusterFuck = require('cluster-fuck');
var options = {
    exec: "mySpecialWorker.js",
    args: ['--my', '--arguments'],
    silent: false,
    workers: 8
};

var cluster = new ClusterFuck(options);

cluster.on('ready', function onClusterReady () {
    console.log('the cluster is now ready!');
});

cluster.on('starting', function onClusterStarting () {
    console.log('starting cluster...');
});

cluster.on('restarting', function onClusterRestarting () {
    console.log('restarting cluster...');
});

cluster.on('restarted', function onClusterRestarted () {
    console.log('cluster restarted!');
});

cluster.on('stopping', function onClusterStopping () {
    console.log('stopping cluster...');
});

cluster.on('stopped', function onClusterStopped () {
    console.log('cluster stopped!');
});

cluster.on('killing', function onClusterKilling () {
    console.log('killing cluster...');
});

cluster.on('killed', function onClusterKilled () {
    console.log('cluster killed!');
});

cluster.start();
```

# Configuration Defaults
```json
{
    "args": [],
    "exec": "server.js",
    "repl": {
        "socket": "prepl.sock"
    },
    "silent": true,
    "workers": 1
}
```