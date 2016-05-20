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

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('lark-PM');

function main(config, WORKER) {
    function fork() {
        var worker = _cluster2.default.fork({
            LARK_PM: WORKER
        });
        debug('lib/cluster.js - cluster() forking worker with pid ' + worker.process.pid + ' ... ');
    }

    debug('lib/cluster.js - cluster() called');
    if (!_cluster2.default.isMaster) {
        return _cluster2.default;
    }
    var schedulingPolicy = _lodash2.default.isString(config.schedulingPolicy) ? config.schedulingPolicy.toLowerCase() : "";
    schedulingPolicy = schedulingPolicy.toLowerCase() !== 'roundrobin' ? _cluster2.default.SCHED_NONE : _cluster2.default.SCHED_RR;
    _cluster2.default.schedulingPolicy = schedulingPolicy;
    debug('lib/cluster.js - cluster() setting up master');
    _cluster2.default.setupMaster();

    var instances = Math.max(Math.round(config.instances) || _os2.default.cpus().length, 1);
    debug('lib/cluster.js - cluster() starting to fork ' + instances + ' worker instances ... ');
    for (var i = 0; i < instances; i++) {
        fork();
    }
    _cluster2.default.on('exit', function (worker, code, signal) {
        debug('lib/cluster.js - cluster.on("exit") emitted by worker with pid ' + worker.process.pid);
        if (code === 0) {
            debug('lib/cluster.js - cluster.on("exit") code is 0, exit as expected');
            return;
        }
        debug('lib/cluster.js - cluster.on("exit") code is ' + code + ', exit unexpected, restarting ... ');
        fork();
    });
    return _cluster2.default;
};

debug('lib/cluster.js load!');
exports.default = main;