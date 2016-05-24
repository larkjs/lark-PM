'use strict';

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _ = require('..');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('lark-PM');

_2.default.configure({
    'daemon-dirname': process.env.HOME,
    'script': _path2.default.join(__dirname, 'app.js'),
    'logFile': _path2.default.join(__dirname, 'logs/process.log'),
    'background': true,
    'instances': 4
});

_2.default.daemon.list().then(function (result) {
    console.log(result);
});