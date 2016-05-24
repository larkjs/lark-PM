'use strict';

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

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
    'daemon-dirname': process.env.HOME,
    'log-file': _path2.default.join(__dirname, 'logs/process.log'),
    'background': true,
    // 'instances': 2,
    'memory': 1 * 1024 * 1024 });

// 1GB
debug('examples/app.js testing PM role');
if (_2.default.isWorker) {
    debug('examples/app.js PM role is WORKER');
    server.listen(3000);
    console.log('Server ' + process.pid + ' has started listening at 3000');
} else if (_2.default.isMaster) {
    debug('examples/app.js PM role is MASTER');
} else if (_2.default.isDaemon) {
    debug('examples/app.js PM role is DAEMON');
} else {
    debug('examples/app.js PM role is NOT SET');
}

debug('examples/app.js loaded!');