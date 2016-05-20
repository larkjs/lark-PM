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

var _cluster = require('./cluster');

var _cluster2 = _interopRequireDefault(_cluster);

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
    },


    /**
     * Start the process manager to work
     **/
    start: function start() {
        if (started) {
            return this;
        }
        debug('lib/pm.js - PM.start() called, process.env.LARK_PM is ' + process.env.LARK_PM || '[NOT SET]');

        if (process.env.LARK_PM === this.WORKER) {
            role = this.WORKER;
        } else if (process.env.LARK_PM === this.MASTER) {
            debug('lib/pm.js - PM.start() calling cluster to fork workers ... ');
            role = this.MASTER;
            (0, _cluster2.default)(this.config, this.WORKER);
        } else if (process.env.LARK_PM === this.DAEMON) {
            role = this.DAEMON;
            _daemon2.default.configure(this.config);
            if (process.argv.indexOf('--lark-pm-stop') >= 0) {
                debug('lib/pm.js - PM.start() calling daemon.stop() to stop runing processes ... ');
                _daemon2.default.stop();
            } else if (process.argv.indexOf('--lark-pm-list') >= 0) {
                debug('lib/pm.js - PM.start() calling daemon.list() to show runing processes ... ');
                _daemon2.default.list(function (err, format) {
                    console.log(err);
                    console.log(format);
                });
            } else {
                debug('lib/pm.js - PM.start() calling daemon.start() to run as daemon in background ... ');
                _daemon2.default.start(this.MASTER);
            }
        } else {
            if (this.config && this.config.background === true) {
                process.env.LARK_PM = this.DAEMON;
            } else {
                process.env.LARK_PM = this.MASTER;
            }
            debug('lib/pm.js - PM.start() no environment LARK_PM found, will try start again ...');
            return this.start();
        }

        started = true;
        debug('lib/pm.js - PM.start() returned');
        return this;
    },


    get isDaemon() {
        this.start();
        return this.ROLE === this.DAEMON;
    },
    get isMaster() {
        this.start();
        return this.ROLE === this.MASTER;
    },
    get isWorker() {
        this.start();
        return this.ROLE === this.WORKER;
    }
}, new _events.EventEmitter());

debug("lib/pm.js loaded!");
exports.default = PM;