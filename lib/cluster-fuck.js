
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
        state,
        workers = [];

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

        delete memory[worker.id];
    });

    cluster.on('exit', function exit (worker) {
        self.emit('exit', worker);

        delete memory[worker.id];
        
        if (!worker.suicide) {
            cluster.fork();
        }

    });

    this.start = function () {

        state = 'starting';
        this.emit(state);

        var forked = 0;
        readyWorkers = 0;

        // start all the workers
        while (forked < config.workers) {
            cluster.fork();
            forked +=1;
        }
    }

    this.startRepl = function () {

        var address = config.repl.address,
            port = config.repl.port,
            clients = [];

        repl = net.createServer();

        repl.on('listening', function replListening () {
            console.log('\nREPL server started: --> `nc %s %s`', address, port );
        });

        repl.on('connection', function replOnConnection (socket) {
            clients.push()
            socket.on('data', function socketOnData(chunk) {

                switch (chunk.toString().trim()) { 
                    case 'help':
                        socket.write(replHelp());
                    break;

                    case 'restart':
                        restart();
                    break;

                    case 'stop':
                        stop();
                    break;
                }

                socket.write('> ');
            });

            socket.on('end', function socketOnEnd () {
                clients.splice(clients.indexOf(socket), 1);
                socket.write('disconnected from REPL server!');
            });

            socket.write('> ');

        });

        repl.on('close', function replOnClose () {
            clients.forEach(function forEachClient (client) {
                client.write('the REPL server died!');
            });
        });

        repl.listen(port, address);

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

    };


    function initWorker (worker) {
        // when a message from this worker is received
        worker.on('message', function message (data) {

           // if the worker is saying it is ready...
            if (data['ready'] && data['ready'] === true) {
                // add 1 to the readyWorkers count
                readyWorkers += 1;

                worker.memory = data['memoryUsage'];
                
                memory[worker.id] = data['memoryUsage'];

                // if all of our workers are ready...
                if (readyWorkers === config.workers) {
                    allReady();

                    // if repl is not defined
                    if (!repl) {
                        self.startRepl();
                    }

                    state = 'ready';
                    self.emit(state);
                }       
            }
        });
    };


    function kill () {

        self.emit('killing');

        var id,
            deadWorkers = 0,
            suicide = true;

        for (id in cluster.workers) {
            cluster.workers[id].kill();
        }

        this.emit('killed');
        process.exit();

    };


    function replHelp () {
        var helpMsg = 
            '\thelp\t\tDisplay this help message\n' +
            '\tinfo\t\tDisplay state info about the cluster\n' +
            '\trestart\t\tRestart all workers in the cluster\n' +
            '\tstop\t\tStop all workers in the cluster\n';

        return helpMsg;
    };

    
    function restart (worker) { 
        var id;

        state = 'restarting';
        self.emit(state);
        
        // if a given worker was specified
        if (worker) {
            worker.kill();
            cluster.fork();
        } else {
            cluster.disconnect(function onceDisconnected () {
                self.start();
            });
        }

        state = 'restarted';
        self.emit(state);
    };

    function stop () {

        state = 'stopping'
        self.emit(state);

        deadWorkers = 0,
        suicide = true;
 
        cluster.disconnect(function () {
            state = 'stopped';
            self.emit(state);
            process.exit();
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