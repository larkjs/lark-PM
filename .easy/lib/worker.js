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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('lark-PM');

function main(config) {
    process.on('message', function (message) {
        switch (message) {
            case 'status':
                process.send({
                    memory: process.memoryUsage()
                });
                break;
        }
    });
    if (config.memory) {
        // memory limit should be at least 40MB
        config.memory = Math.max(config.memory, 40 * 1024 * 1024);
        setInterval(function () {
            var memory = process.memoryUsage();
            if (memory.heapUsed > config.memory) {
                console.log("Worker " + process.pid + " exiting due to memory limit ... ");
                process.exit(1);
            }
        }, 5000);
    }
}

debug('lib/worker.js load');
exports.default = main;