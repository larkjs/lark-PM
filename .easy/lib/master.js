'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _daemon = require('./daemon');

var _daemon2 = _interopRequireDefault(_daemon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('lark-PM');

function main(config, WORKER) {
    if (!_cluster2.default.isMaster) {
        throw new Error("Internal Error");
    }

    function fork() {
        var worker = _cluster2.default.fork({
            LARK_PM: WORKER
        });
        worker.process.ctime = Date.now();
        worker.on('message', function (message) {
            worker.process.heapUsed = message.memory.heapUsed;
        });
        debug('lib/master.js - master() forking worker with pid ' + worker.process.pid + ' ... ');
        return worker;
    }

    debug('lib/master.js - master() called');

    var schedulingPolicy = _lodash2.default.isString(config.schedulingPolicy) ? config.schedulingPolicy.toLowerCase() : "";
    schedulingPolicy = schedulingPolicy.toLowerCase() !== 'roundrobin' ? _cluster2.default.SCHED_NONE : _cluster2.default.SCHED_RR;
    _cluster2.default.schedulingPolicy = schedulingPolicy;
    debug('lib/master.js - master() setting up master');
    _cluster2.default.setupMaster();

    config.instances = config.instances || 1;
    if (_lodash2.default.isString(config.instances) && config.instances.trim().toLowerCase() === 'max') {
        config.instances = _os2.default.cpus();
    }
    var instances = Math.max(Math.round(config.instances), 1);
    debug('lib/master.js - master() starting to fork ' + instances + ' worker instances ... ');

    for (var i = 0; i < instances; i++) {
        var worker = fork();
        worker.process.restarts = 0;
    }

    _cluster2.default.on('exit', function (worker, code, signal) {
        debug('lib/master.js - cluster.on("exit") emitted by worker with pid ' + worker.process.pid);
        if (code === 0) {
            debug('lib/master.js - cluster.on("exit") code is 0, exit as expected');
            if (Object.keys(_cluster2.default.workers).length === 0) {
                debug('lib/master.js - cluster.on("exit") no worker is running, master exiting ... ');
                if (process.env.LARK_PM_BACKGROUND) {
                    _daemon2.default.stop().once('error', function (error) {
                        return console.log(error.message);
                    });
                } else {
                    process.exit(0);
                }
            }
            return;
        }
        debug('lib/master.js - cluster.on("exit") code is ' + code + ', exit unexpected, restarting ... ');
        var newWorker = fork();
        newWorker.process.restarts = worker.process.restarts + 1;
    });

    setInterval(function () {
        for (var id in _cluster2.default.workers) {
            var _worker = _cluster2.default.workers[id];
            _worker.send('status');
        }
    }, 5000);

    cli();
    return _cluster2.default;
};

function getWorkerStatus() {
    var workers = [];
    for (var id in _cluster2.default.workers) {
        var worker = _cluster2.default.workers[id];
        workers.push({
            id: worker.id,
            file: process.mainModule.filename,
            state: worker.state,
            memory: worker.process.heapUsed,
            pid: worker.process.pid,
            ctime: worker.process.ctime,
            restarts: worker.process.restarts
        });
    }
    return workers;
}

function cli() {
    var socketFile = _path2.default.join(_path2.default.dirname(process.mainModule.filename), '.worker_status.sock');
    var server = _net2.default.createServer(function (socket) {
        var data = "";
        socket.on('data', function (chunk) {
            data = data + chunk;
            if (!_lodash2.default.endsWith(data, '\r\n')) {
                return;
            }
            data = data.trim();
            if (data === 'status') {
                socket.write(JSON.stringify(getWorkerStatus()));
                socket.end();
            } else if (data.indexOf('message:') === 0) {
                var message = data.slice('message'.length);
                process.emit('daemon-message', message, function () {
                    var result = arguments.length <= 0 || arguments[0] === undefined ? "" : arguments[0];

                    socket.write(result);
                    socket.end();
                });
            }
        });
    }).listen(socketFile);;
    process.on('exit', function () {
        return server.close();
    });
}

debug('lib/master.js load!');
exports.default = main;