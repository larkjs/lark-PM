'use strict';

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _ = require('..');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('lark-PM');

var server = _http2.default.createServer(function (req, res) {
    console.log(process.pid + ' has recieved a request');
    res.write(process.pid + ' is at your service');
    res.end();
});

_2.default.configure({
    'root': process.env.HOME,
    'background': true,
    'instances': 4
});

debug('examples/app.js testing PM role');
if (_2.default.isWorker) {
    debug('examples/app.js PM role is WORKER');
    server.listen(3000);
    console.log('Server ' + process.pid + ' has started listening at 3000');
} else if (_2.default.isMaster) {
    debug('examples/app.js PM role is MASTER');
    _2.default.on('start', function () {
        return console.log("Service started !");
    });
    _2.default.on('stop', function () {
        return console.log("Service stopped !");
    });
} else if (_2.default.isDaemon) {
    debug('examples/app.js PM role is DAEMON');
} else {
    debug('examples/app.js PM role is NOT SET');
}

debug('examples/app.js loaded!');