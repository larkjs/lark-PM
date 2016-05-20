'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _forever = require('forever');

var _forever2 = _interopRequireDefault(_forever);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('lark-PM');

var script = process.mainModule.filename;
var dirname = _path2.default.dirname(script);
var foreverDirname = _path2.default.join(dirname, '.forever');
var config = {};

var daemon = {
    configure: function configure(customConfig) {
        debug('lib/daemon.js - daemon.configure() called');
        if (_lodash2.default.isString(customConfig.root)) {
            if (!_path2.default.isAbsolute(customConfig.root) || !_fs2.default.statSync(customConfig.root).isDirectory()) {
                throw new Error('Root should be an absolute path of a directory');
            }
            dirname = customConfig.root;
            foreverDirname = _path2.default.join(dirname, '.forever');
        }
        config = _lodash2.default.merge(config, customConfig);
        config.root = foreverDirname;

        _forever2.default.load({ root: config.root });
        return this;
    },
    start: function start(MASTER) {
        debug('lib/daemon.js - daemon.start() called');

        var logFile = config.logFile || 'logs/process_management.log';
        if (!_path2.default.isAbsolute(logFile)) {
            logFile = _path2.default.join(dirname, logFile);
        }
        _mkdirp2.default.sync(_path2.default.dirname(logFile));

        _mkdirp2.default.sync(foreverDirname);
        debug('lib/daemon.js - daemon() starting script with forever ... ');
        var options = {
            'slient': config.slient === false ? false : true,
            'uid': script,
            'killTree': true,
            'env': {
                'LARK_PM': MASTER
            },
            'cwd': _path2.default.dirname(script),
            'logFile': logFile,
            'outFile': logFile,
            'errFile': logFile
        };
        _forever2.default.startDaemon(script, options);
        return this;
    },
    stop: function stop() {
        debug('lib/daemon.js - daemon.stop() called');
        debug('lib/daemon.js - daemon() stopping script with forever ... ');
        _forever2.default.stop(script);
    },
    list: function list(callback) {
        debug('lib/daemon.js - daemon.list() called');
        debug('lib/daemon.js - daemon() listing script with forever ... ');
        _forever2.default.list(false, callback);
    }
};

debug('lib/daemon.js load');
exports.default = daemon;