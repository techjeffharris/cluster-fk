
var ClusterFuck = require('cluster-fuck');
var options = {
        exec: "cf-worker.js",
        silent: false,
        workers: 2
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

cluster.start();