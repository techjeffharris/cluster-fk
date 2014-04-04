
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
		    "shutdownTimeout": 5000,
		    "workers": 1
		},
		interrupt,
    	memory = {},
		repl,
		self = this,
		state = 'stopped';

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
		readyWorkers--;


		if (readyWorkers === 0) {
			state = 'stopped';
			self.emit(state);
		}

	});

	cluster.on('exit', function exit (worker) {
		self.emit('exit', worker);
		
		delete memory[worker.id];
		
		if (state === 'ready') {
			cluster.fork();
		}

	});

	cluster.on('setup', function () {
		self.emit('setup');
	});

	this.memoryUsage = function (unit) {

		var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'],
			usage = {
				cluster: {
					rss: 0,
					heapUsed: 0,
					heapTotal: 0
				},
				master : process.memoryUsage(),
				workers : memory,
				workerTotal : 0
			},
			workerId;

		usage.cluster.rss = usage.master.rss;
		usage.cluster.heapTotal = usage.master.heapTotal;
		usage.cluster.heapUsed = usage.master.heapUsed;

		for (workerId in usage.workers) {
			usage.cluster.rss += usage.workers[workerId].rss;
			usage.cluster.heapTotal = usage.workers[workerId].heapTotal;
			usage.cluster.heapUsed = usage.workers[workerId].heapUsed;

			usage.workerTotal += usage.workers[workerId].rss;
		}

		if (units.indexOf(unit) > -1) {
			return usage.cluster.rss / utils[unit];
		} else {
			return usage;
		}

	};

	this.start = function () {
		var worker;

		state = 'starting';
		self.emit(state);
		
		if (!repl) {
			startRepl();
		}

		var forked = 0;
		readyWorkers = 0;

		// start all the workers
		while (forked < config.workers) {
			cluster.fork();
			forked++;

		}

	};

	this.shutdown = function (done) {

		done = (utils.getType(done) === 'function') 
			? done
			: function () {};

		self.emit('shuttingDown');

		if (readyWorkers > 0) {
			stopWorkers(function () {
				repl.stop(function () {
					self.emit('shutdown');
					done();
				})
			});	

			setTimeout(function shutdownTimeout () {
				console.log('shutdown timeout exceeded!');
				done();
			}, config.shutdownTimeout);
		} else { 

			self.emit('shutdown');
			done();
		}
	
	};


	function allReady () {

		var msg = '\n\t%s worker';

		if ( config.workers > 1 ) {
			msg += 's';
		}

		msg += ' running.';
		
		console.log(util.format(msg, config.workers));

		console.log('\ntotal memory usage: %s MB', self.memoryUsage('MB'));

		state = 'ready';
		self.emit(state);
		

	};


	function clusterStatus (socket) {

		var msg = 
			'\tState:\t\t' + state + '\n' +
			'\tReady Workers:\t' + readyWorkers + '\n' +
			'\tMemory:\t\t' + self.memoryUsage('MB') + ' MB\n';

		socket.write(msg);
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


	function killWorkers () {

		state = 'killing';
		self.emit(state);
		

		var id;

		for (id in cluster.workers) {
			cluster.workers[id].kill();
		}

		state = 'killed';
		self.emit(state);

	};

	
	function restartWorkers () { 

		state = 'restarting';
		self.emit(state);	

		stopWorkers(function () {
			state = 'restarted';
			self.emit(state);

			self.start();
		});

	};


	function startRepl() {

		repl = new Prepl(config.repl);

		var eventNames = ['starting', 'ready', 'stopping', 'stopped'];

		eventNames.forEach(function (eventName) {
			repl.on(eventName, function () {
				console.log(eventName + ' REPL server.');
			});
		});

		eventNames.concat(['killing', 'killed', 'restarting', 'restarted', 'shuttingDown', 'shutdown']);

		eventNames.forEach(function (eventName) {
			self.on(eventName, function () {
				repl.broadcast('\n' + eventName + ' cluster.\n> ');	
			});
		});

	    repl.register([
	        {
	        	name: "status",
	        	help: "Display the status of the Cluster",
	        	action: clusterStatus
	        },
	        {
	        	name: "memory",
	        	help: "Display detailed memory information.",
	        	action: function (socket) {
	        		socket.write(util.format(self.memoryUsage()) + '\n');
	        	}
	        },
	    	{
	    		name: "start",
	    		help: "Start the cluster",
	    		action: function (socket) {
	    			if (state === 'stopped' || state === 'killed') {
						self.start();
					} else {
	    				socket.write('err: not ready to start!\n');
	    			}
	    		}
	    	},
	    	{
	    		name: "restart",
	    		help: "Restart all workers gracefully",
	    		action: function (socket) {
	    			if (state === 'ready') {
	    				restartWorkers();
					} else {
	    				socket.write('err: not ready to restart!\n');
	    			}
	    		}
	    	},
	    	{
	    		name: "stop",
	    		help: "Stop all workers gracefully",
	    		action: function (socket) {
	    			if (state === 'ready') {
	    			    stopWorkers();
	    			} else {
	    				socket.write('err: not ready to stop!\n');
	    			}
	    		}	
	    	},
	    	{ 
	    		name: "kill",
	    		help: "Kill all workers immediately",
	    		action: function (socket) {
	    			if (state === 'ready') {
	    				killWorkers();
					} else {
	    				socket.write('err: not ready to kill!\n');
	    			}
	    		}
	    	},
	    	{
	    		name: "shutdown", 
	    		help: "Stop all workers gracefully, then shutdown the cluster.",
	    		action: function (socket) {
	    			if (state === 'ready' || state === 'stopped') {
	    			    self.shutdown(process.exit);
					} else {
	    				socket.write('err: not ready to shutdown!\n');
	    			}
	    		}
	    	}
	    ]);


	    repl.start();

	};


	function stopWorkers (done) {

		state = 'stopping'
		self.emit(state);

		var worker,
			workers = cluster.workers;

		if (utils.getType(done) === 'function') {
            self.once('stopped', done);
		} 

		for (worker in workers) {
			workers[worker].disconnect();
		}
		
	};

	function workerMemory (done) {

	};

};

util.inherits(ClusterFuck, events.EventEmitter);
