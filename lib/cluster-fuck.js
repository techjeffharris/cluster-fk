
var cluster = require('cluster'),
	events = require('events'),
	fs = require('fs'),
	net = require('net'),
	os = require('os'),
	path = require('path'),
	Prepl = require('prepl'),
	util = require('util'),
	utils = require('techjeffharris-utils');

module.exports = ClusterFuck;

function ClusterFuck (options) {

	var config,
		defaults = {
		    "args": [],
		    "exec": "server.js",
		    "silent": true,
		    "workers": 1
		},
		interrupt,
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

	process.on('SIGINT', function () {
	    if (interrupt === undefined) {
	        console.log('\n(^C again to quit)'); 
	        interrupt = setTimeout(function () {
	            interrupt = undefined;
	        }, 500);
	    } else {
	        self.shutdown();
	    }
	});

	this.start = function () {
		var worker;

		state = 'starting';
		this.emit(state);
		
		if (!repl) {
			startRepl();
		}

		var forked = 0;
		readyWorkers = 0;

		// start all the workers
		while (forked < config.workers) {
			cluster.fork();
			forked +=1;

		}
	};

	this.shutdown = function (done) {

		if (utils.getType(done) === 'function') {
            this.on('exit', done);
        }
		
		repl.close(function () {
			self.emit('exit');
			
		});
	
		
	};


	function allReady () {

		var msg = '\n\t%s worker';

		if ( config.workers > 1 ) {
			msg += 's';
		}

		msg += ' running.';
		
		console.log(util.format(msg, config.workers));

		console.log('\ntotal memory usage: %s MB', totalMemory());

		state = 'ready';
		self.emit(state);
		

	};


	function initWorker (worker) {
		// when a message from this worker is received
		worker.on('message', function message (data) {

		   // if the worker is saying it is ready...
			if (data['ready'] && data['ready'] === true) {
				// add 1 to the readyWorkers count
				readyWorkers++;

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
		

		var id;

		for (id in cluster.workers) {
			cluster.workers[id].kill();
		}

		readyWorkers = 0;
		state = 'killed';
		self.emit(state);
		

	};

	
	function restart () { 
		var id;

		state = 'restarting';
		self.emit(state);
		
		
		cluster.disconnect(function onceDisconnected () {
			self.start();
		});
		
		state = 'restarted';
		self.emit(state);
		
	};


	function startRepl() {

		repl = new Prepl(config.repl);

	    repl.register([
	    	{
	    		name: "start",
	    		help: "Start the cluster",
	    		action: self.start
	    	},
	    	{
	    		name: "restart",
	    		help: "Restart the cluster gracefully",
	    		action: restart
	    	},
	    	{
	    		name: "stop",
	    		help: "Stop the cluster gracefully",
	    		action: stop
	    	},
	    	{ 
	    		name: "kill",
	    		help: "Kill all workers immediately",
	    		action: kill
	    	},
	    ]);

	    repl.start();

	};


	function stop (done) {

		state = 'stopping'
		self.emit(state);
 
		cluster.disconnect(function () {

			readyWorkers = 0;
			state = 'stopped';
			self.emit(state);

			done();
			
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
