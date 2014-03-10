
var cluster = require('cluster'),
    events = require('events'),
    net = require('net'),
    os = require('os'),
    util = require('util'),
    utils = require('./utils');

module.exports = ClusterFuck;

function ClusterFuck (options) {

    var config,
        defaults = require('../config.default.json'),
        memory = {},
        repl,
        self = this,
        state;

    config = utils.extend(defaults, options);

    cluster.setupMaster({
        args: config.args,
        exec: config.exec,
        silent: config.silent
    });

    cluster.on('fork', function fork (worker) {
        self.emit('fork', worker);
    });

    cluster.on('online', function online (worker) {
        self.emit('online', worker);
        initWorker(worker);
    });

    cluster.on('disconnect', function disconnect (worker) {
        self.emit('disconnect', worker);

    });

    cluster.on('exit', function exit (worker) {
        self.emit('exit', worker);

        delete memory[worker.id];
        
        if (state === 'ready') {
            cluster.fork();
        }

    });

    this.start = function () {

        if (!repl) {
            startRepl();
        }

        state = 'starting';
        this.emit(state);
        repl.emit(state);


        var forked = 0;
        readyWorkers = 0;

        // start all the workers
        while (forked < config.workers) {
            worker = cluster.fork();
            forked +=1;
        }
    };


    function allReady () {

        var msg = '\n\t%s worker';

        if ( config.workers > 1 ) {
            msg += 's';
        }

        msg += ' running.';
        
        console.log(util.format(msg, config.workers));

        console.log('\nCluster fucked!');

        console.log('\ntotal memory usage: %s MB', totalMemory());

        state = 'ready';
        self.emit(state);
        repl.emit(state);

    };


    function initWorker (worker) {
        // when a message from this worker is received
        worker.on('message', function message (data) {

           // if the worker is saying it is ready...
            if (data['ready'] && data['ready'] === true) {
                // add 1 to the readyWorkers count
                readyWorkers++;

                worker.memory = data['memoryUsage'];
                
                memory[worker.id] = data['memoryUsage'];

                // if all of our workers are ready...
                if (readyWorkers === config.workers) {
                    allReady();
                }       
            }
        });
    };


    function kill () {

        state = 'killing';
        self.emit(state);
        repl.emit(state);

        var id;

        for (id in cluster.workers) {
            cluster.workers[id].kill();
        }

        readyWorkers = 0;
        state = 'killed';
        self.emit(state);
        repl.emit(state);

    };

    function replHelp (socket) {
        var helpMsg = 
            '\thelp\t\tDisplay this help message\n' +
            '\tinfo\t\tDisplay info about the cluster\n' +
            '\tkill\t\tKill all workers immediately\n' +
            '\trestart\t\tRestart the cluster gracefully\n' +
            '\tstop\t\tStop the cluster gracefully';

        socket.write(helpMsg);

    };


    function replInfo (socket) {
        var infoMsg = util.format(
            '\tstate\t\t%s\n' +
            '\tworkers\t\t%s\n' + 
            '\texec\t\t%s\n' +
            '\targs\t\t%s\n' +
            '\tsilent\t\t%s',
            state,
            readyWorkers,
            config.exec,
            config.args,
            config.silent
        );

        socket.write(infoMsg);

    };

    
    function restart () { 
        var id;

        state = 'restarting';
        self.emit(state);
        repl.emit(state);
        
        cluster.disconnect(function onceDisconnected () {
            self.start();
        });
        
        state = 'restarted';
        self.emit(state);
        repl.emit(state);
    };


    function startRepl() {

        var address = config.repl.address,
            port = config.repl.port,
            clients = [];

        repl = net.createServer();

        repl.on('listening', function replListening () {
            console.log('\nREPL server started: --> `nc %s %s`', address, port );
        });

        repl.on('connection', function replOnConnection (socket) {

            clients.push(socket);

            socket.on('data', function socketOnData(chunk) {

                switch (chunk.toString().trim()) { 
                    case 'help':
                        replHelp(socket);
                        socket.write('\n> ');
                        break;

                    case 'info':
                        replInfo(socket);
                        socket.write('\n> ');
                        break;

                    case 'kill':
                        socket.write('> ');
                        kill();
                        break;

                    case 'restart':
                        socket.write('> ');
                        restart();
                        break;

                    case 'start':
                        socket.write('> ');
                        self.start();
                        break;

                    case 'stop':
                        socket.write('> ');
                        stop();
                        break;

                    default: 
                        socket.write('> ');
                        break;
                }

            });

            socket.on('end', function socketOnEnd () {
                clients.splice(clients.indexOf(socket), 1);
            });

            socket.write('> ');

        });

        repl.on('close', function replOnClose () {
            clients.forEach(function forEachClient (client) {
                client.write('the REPL server died!');
            });
        });

        repl.on('ready', function onReplReady () {
            broadcast('the cluster is now ready!');
        });

        repl.on('starting', function onReplStarting () {
            broadcast('starting cluster...');
        });

        repl.on('restarting', function onReplRestarting () {
            broadcast('restarting cluster...');
        });

        repl.on('restarted', function onReplRestarted () {
            broadcast('cluster restarted!');
        });

        repl.on('stopping', function onReplStopping () {
            broadcast('stopping cluster...');
        });

        repl.on('stopped', function onReplStopped () {
            broadcast('cluster stopped!');
        });

        repl.on('killing', function onReplKilling () {
            broadcast('killing cluster...');
        });

        repl.on('killed', function onReplKilled () {
            broadcast('cluster killed!');
        });

        repl.listen(port, address);

        function broadcast (message) {
            clients.forEach(function (socket) {
                socket.write('\n' + message + '\n> ');
            });
        } 

    };


    function stop () {

        state = 'stopping'
        self.emit(state);
        repl.emit(state);
 
        cluster.disconnect(function () {

            readyWorkers = 0;
            state = 'stopped';
            self.emit(state);
            repl.emit(state);
        });

    };

    function totalMemory () {

        var masterMemory = process.memoryUsage().heapTotal,
            serverTotal,
            workerId,
            workerTotal = 0;

        for (workerId in memory) {
            workerTotal += memory[workerId];
        }

        serverTotal = masterMemory + workerTotal;

        return serverTotal / utils.MB;
    };

};

util.inherits(ClusterFuck, events.EventEmitter);