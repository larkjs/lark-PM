'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _events = require('events');

var _args = require('./args');

var _args2 = _interopRequireDefault(_args);

var _worker = require('./worker');

var _worker2 = _interopRequireDefault(_worker);

var _master = require('./master');

var _master2 = _interopRequireDefault(_master);

var _daemon = require('./daemon');

var _daemon2 = _interopRequireDefault(_daemon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('lark-PM');

/**
 * Define private locals
 **/
var config = {};
var started = false;
var role = "UNDEFINED";

var PM = _lodash2.default.extend({
    /**
     * define private constants
     **/
    get DAEMON() {
        return 'DEAMON';
    },
    get MASTER() {
        return 'MASTER';
    },
    get WORKER() {
        return 'WORKER';
    },
    get ROLE() {
        return role.toUpperCase();
    },

    /**
     * Expose read only access to private locals
     **/
    get started() {
        return !!started;
    },
    get config() {
        return _lodash2.default.cloneDeep(config);
    },
    get daemon() {
        return _daemon2.default;
    },

    /**
     * Configure the process manager
     * Throws error if process manager has started to work
     **/
    configure: function configure() {
        var customConfig = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        if (started) {
            return this;
        }
        config = _lodash2.default.merge(this.config, customConfig);
        _args2.default.configure(this.config);
        _daemon2.default.configure(this.config);
    },


    /**
     * Start the process manager to work
     **/
    run: function run() {
        if (started) {
            return this;
        }
        debug('lib/pm.js - PM.run() called, process.env.LARK_PM is ' + process.env.LARK_PM || '[NOT SET]');

        var writable = this.config.output || process.stdout;

        if (process.env.LARK_PM === this.WORKER) {
            debug('lib/pm.js -PM.run() calling worker to init this worker ... ');
            role = this.WORKER;
            (0, _worker2.default)(this.config);
        } else if (process.env.LARK_PM === this.MASTER) {
            debug('lib/pm.js - PM.run() calling master to fork workers ... ');
            role = this.MASTER;
            (0, _master2.default)(this.config, this.WORKER);
        } else if (process.env.LARK_PM === this.DAEMON) {
            role = this.DAEMON;
            if (_args2.default.isStop) {
                debug('lib/pm.js - PM.run() calling daemon.stop() to stop runing processes ... ');
                writable.write('Stopping application ...\n');
                _daemon2.default.stop().once('error', function (error) {
                    return writable.write("Error: Can not stop, no running processes found \n");
                });
            } else if (_args2.default.isList) {
                debug('lib/pm.js - PM.run() calling daemon.list() to show runing processes ... ');
                writable.write('Listing application status ...\n');
                _daemon2.default.list().then(function (format) {
                    writable.write(_daemon2.default.beautify(format) + "\n");
                }).catch(function (error) {
                    writable.write(error.message + "\n");
                    writable.write(error.stack + "\n");
                });
            } else {
                debug('lib/pm.js - PM.run() calling daemon.run() to run as daemon in background ... ');
                writable.write('Starting application ...\n');
                _daemon2.default.start(this.MASTER);
            }
        } else {
            if (this.config && this.config.background === true) {
                process.env.LARK_PM = this.DAEMON;
            } else {
                process.env.LARK_PM = this.MASTER;
            }
            debug('lib/pm.js - PM.run() no environment LARK_PM found, will try start again ...');
            return this.run();
        }

        started = true;
        debug('lib/pm.js - PM.run() returned');
        return this;
    },


    get isDaemon() {
        this.run();
        return this.ROLE === this.DAEMON;
    },
    get isMaster() {
        this.run();
        return this.ROLE === this.MASTER;
    },
    get isWorker() {
        this.run();
        return this.ROLE === this.WORKER;
    },

    worker: function worker(handler) {
        if (this.isWorker) {
            handler();
        }
    },
    master: function master(handler) {
        if (this.isMaster) {
            handler();
        }
    },
    deamon: function deamon(handler) {
        if (this.isDaemon) {
            handler();
        }
    }
}, new _events.EventEmitter());

PM.configure();

debug("lib/pm.js loaded!");
exports.default = PM;