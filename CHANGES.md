CHANGELOG
=========

## v1.1
### v1.1.2
* 

### v1.1.1
* `function totalMemory` is now `ClusterFuck.memoryUsage`
* `ClusterFuck.memoryUsage` optionally takes a unit for formatting ('B', 'KB', etc.)
* memoryUsage now uses `rss` property from `process.memoryUsage()` rather than `heapTotal`.
* fixed ^C logic - workers don't die and won't hang if no workers are running.
* added `shutdownTimeout` with default `5000` milliseconds to `config`.
* `ClusterFuck.shutdown` first disconnects all workers, then closes `repl`
* when workers `disconnect` or `exit`, `readyWorkers` is updated.
* when a worker disconnects, if there are no ready workers, event `'stopped'` is emitted.
* renamed private functions `kill` and `restart` to `killWorkers` and `restartWorkers`, respectively.
* added event handler to expose cluster's 'setup' event.
* fixed typo `ClusterFuck.shudown`; now reads `ClusterFuck.shutdown`.
* examples in README now call the module instance `myCluster` for disambiguation.
* added `status` and `memory` to list of commands registered to `repl`
* README mentions repl server
* added events `shuttingDown` and `shutdown`.

### v1.1.0
* no more config.default.json; configuration defaults are now hard-coded.
* retroactively updated CHANGES.md to encourage disciplined semantic versioning.
* updated TODO.md.
* updated README.md

## v1.0
### v1.0.5
* updated README.md.

### v1.0.4
* default worker file is called server.js.

### v1.0.3
* replaced hard-coded REPL server with module [prepl](https://github.com/techjeffharris/prepl.git).

### v1.0.2
* updated README.md.

### v1.0.1
* added verbose console logs to test/cf-master.js.

### v1.0.0
* added verbose console logs for killing and killed events in test/cf-master.js.
* updated test/cf-worker.js to simulate indeterminate delays before workers are ready.
