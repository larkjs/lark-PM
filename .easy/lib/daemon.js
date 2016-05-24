'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _forever2 = require('forever');

var _forever3 = _interopRequireDefault(_forever2);

var _bytes = require('bytes');

var _bytes2 = _interopRequireDefault(_bytes);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _table = require('table');

var _table2 = _interopRequireDefault(_table);

var _dateFormat = require('date-format');

var _dateFormat2 = _interopRequireDefault(_dateFormat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('lark-PM');

var script = process.mainModule.filename;
var scriptDirname = null;
var daemonDirname = null;
var config = {};

function forever() {
    _forever3.default.load({ root: daemonDirname });
    return _forever3.default;
};

var daemon = {
    configure: function configure() {
        var customConfig = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        debug('lib/daemon.js - daemon.configure() called');
        config = _lodash2.default.merge(config, customConfig);

        script = config.script || process.mainModule.filename;
        if (!_path2.default.isAbsolute(script)) {
            script = _path2.default.join(_path2.default.dirname(process.mainModule.filename), script);
        }
        scriptDirname = _path2.default.dirname(script);

        daemonDirname = config['daemon-dirname'] || _path2.default.dirname(script);
        if (!_lodash2.default.endsWith(daemonDirname, '.forever')) {
            daemonDirname = _path2.default.join(daemonDirname, '.forever');
        }
        return this;
    },
    start: function start(MASTER) {
        this.stop().once('error', function (error) {
            return debug('lib/daemon.js - daemon.start() calling daemon.stop() failed : ' + error.message);
        });
        debug('lib/daemon.js - daemon.start() called');

        var logFile = config['log-file'] || 'logs/process_management.log';
        if (!_path2.default.isAbsolute(logFile)) {
            logFile = _path2.default.join(scriptDirname, logFile);
        }

        _mkdirp2.default.sync(_path2.default.dirname(logFile));
        _mkdirp2.default.sync(daemonDirname);

        debug('lib/daemon.js - daemon() starting script with forever ... ');
        var options = {
            'slient': config.slient === false ? false : true,
            'uid': script,
            'killTree': true,
            'env': {
                'LARK_PM': MASTER,
                'LARK_PM_BACKGROUND': true
            },
            'cwd': scriptDirname,
            'pidFile': _path2.default.join(scriptDirname, '.' + _path2.default.basename(script) + '.pid'),
            'logFile': logFile,
            'outFile': logFile,
            'errFile': logFile
        };
        return forever().startDaemon(script, options);
    },
    restart: function restart() {
        return this.start();
    },
    stop: function stop() {
        debug('lib/daemon.js - daemon.stop() called');
        debug('lib/daemon.js - daemon() stopping script with forever ... ');
        return forever().stop(script);
    },
    list: function list() {
        debug('lib/daemon.js - daemon.list() called');

        debug('lib/daemon.js - daemon() listing script with forever ... ');
        var daemon = new Promise(function (resolve, reject) {
            forever().list(false, function (error, processList) {
                processList = processList || [];
                var result = null;
                for (var _iterator = processList, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
                    var _ref;

                    if (_isArray) {
                        if (_i >= _iterator.length) break;
                        _ref = _iterator[_i++];
                    } else {
                        _i = _iterator.next();
                        if (_i.done) break;
                        _ref = _i.value;
                    }

                    var _process = _ref;

                    if (_process.file === script) {
                        result = _process;
                        break;
                    }
                }
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });

        debug('lib/daemon.js - daemon() listing workers ... ');
        var workers = new Promise(function (resolve, reject) {
            var client = _net2.default.createConnection(_path2.default.join(scriptDirname, '.worker_status.sock'));
            client.write('status\r\n');

            var data = [];
            client.on('data', function (chunk) {
                return data.push(chunk);
            });
            client.on('end', function () {
                var result = Buffer.concat(data).toString();
                try {
                    result = JSON.parse(result);
                } catch (e) {
                    return resolve([]);
                }
                resolve(result);
            });
            client.on('error', function (error) {
                return resolve([]);
            });
        });

        return Promise.all([daemon, workers]).then(function (result) {
            var processes = [];
            result[0] && processes.push(result[0]);
            for (var _iterator2 = result[1], _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
                var _ref2;

                if (_isArray2) {
                    if (_i2 >= _iterator2.length) break;
                    _ref2 = _iterator2[_i2++];
                } else {
                    _i2 = _iterator2.next();
                    if (_i2.done) break;
                    _ref2 = _i2.value;
                }

                var worker = _ref2;

                worker.isMaster = false;
                processes.push(worker);
            }
            return Promise.resolve(processes);
        });
    },
    status: function status() {
        return this.list();
    },
    beautify: function beautify() {
        var list = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

        var appname = script;
        if (appname.indexOf(process.env.HOME) === 0) {
            appname = '~' + appname.slice(process.env.HOME.length);
        }

        var title = _chalk2.default.cyan("Application : " + appname + "\n");
        var show = [['Role', 'PID', 'Restarts', 'Memory Usage', 'Online Time']];
        if (!Array.isArray(list) || list.length === 0) {
            return _chalk2.default.cyan(title + (0, _table2.default)(show));
        }

        for (var _iterator3 = list, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
            var _ref3;

            if (_isArray3) {
                if (_i3 >= _iterator3.length) break;
                _ref3 = _iterator3[_i3++];
            } else {
                _i3 = _iterator3.next();
                if (_i3.done) break;
                _ref3 = _i3.value;
            }

            var _process2 = _ref3;

            show.push([_process2.isMaster ? 'Master' : 'Worker', _process2.pid, _process2.restarts === 0 ? _process2.restarts : _process2.restarts, _process2.memory ? (0, _bytes2.default)(_process2.memory) : '-', (0, _dateFormat2.default)('yyyy-MM-dd hh:mm:ss', new Date(_process2.ctime))]);
        }
        return _chalk2.default.cyan(title + (0, _table2.default)(show));
    }
};

daemon.configure();

debug('lib/daemon.js load');
exports.default = daemon;