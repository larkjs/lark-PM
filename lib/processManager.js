'use strict';

import $        from 'lodash';
import _debug   from 'debug';
import extend   from 'extend';
import { EventEmitter } from 'events';

import cluster  from './cluster';
import daemon   from './daemon';

const debug = _debug('lark-PM');

/**
 * Define private locals
 **/
let config   = {};
let started  = false;
let role     = "UNDEFINED";

const PM = $.extend({
    /**
     * define private constants
     **/
    get DAEMON () {
        return 'DEAMON';
    },
    get MASTER () {
        return 'MASTER';
    },
    get WORKER () {
        return 'WORKER';
    },
    get ROLE () {
        return role.toUpperCase();
    },

    /**
     * Expose read only access to private locals
     **/
    get started () {
        return !!started;
    },
    get config () {
        return $.cloneDeep(config);
    },

    /**
     * Configure the process manager
     * Throws error if process manager has started to work
     **/
    configure (customConfig = {}) {
        if (started) {
            return this;
        }
        config = $.merge(this.config, customConfig); 
    },

    /**
     * Start the process manager to work
     **/
    start () {
        if (started) {
            return this;
        }
        debug('lib/pm.js - PM.start() called, process.env.LARK_PM is ' + process.env.LARK_PM || '[NOT SET]');

        if (process.env.LARK_PM === this.WORKER) {
            role = this.WORKER;
        }
        else if (process.env.LARK_PM === this.MASTER) {
            debug('lib/pm.js - PM.start() calling cluster to fork workers ... ');
            role = this.MASTER;
            cluster(this.config, this.WORKER);
        }
        else if (process.env.LARK_PM === this.DAEMON) {
            role = this.DAEMON;
            daemon.configure(this.config);
            if (process.argv.indexOf('--lark-pm-stop') >= 0) {
                debug('lib/pm.js - PM.start() calling daemon.stop() to stop runing processes ... ');
                daemon.stop();
            }
            else if (process.argv.indexOf('--lark-pm-list') >= 0) {
                debug('lib/pm.js - PM.start() calling daemon.list() to show runing processes ... ');
                daemon.list((err, format) => {
                    console.log(err);
                    console.log(format);
                });
            }
            else {
                debug('lib/pm.js - PM.start() calling daemon.start() to run as daemon in background ... ');
                daemon.start(this.MASTER);
            }
        }
        else {
            if (this.config && this.config.background === true) {
                process.env.LARK_PM = this.DAEMON;
            }
            else {
                process.env.LARK_PM = this.MASTER;
            }
            debug('lib/pm.js - PM.start() no environment LARK_PM found, will try start again ...');
            return this.start();
        }

        started = true;
        debug('lib/pm.js - PM.start() returned');
        return this;
    },

    get isDaemon () {
        this.start();
        return this.ROLE === this.DAEMON;
    },
    get isMaster () {
        this.start();
        return this.ROLE === this.MASTER;
    },
    get isWorker () {
        this.start();
        return this.ROLE === this.WORKER;
    },
}, new EventEmitter());

debug("lib/pm.js loaded!");
export default PM;
