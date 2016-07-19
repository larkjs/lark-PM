'use strict';

import $        from 'lodash';
import _debug   from 'debug';
import extend   from 'extend';
import { EventEmitter } from 'events';

import args     from './args';
import worker   from './worker';
import master   from './master';
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
    get daemon () {
        return daemon;
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
        args.configure(this.config);
        daemon.configure(this.config);
    },

    /**
     * Start the process manager to work
     **/
    run () {
        if (started) {
            return this;
        }
        debug('lib/pm.js - PM.run() called, process.env.LARK_PM is ' + process.env.LARK_PM || '[NOT SET]');

        let writable = this.config.output || process.stdout;

        if (process.env.LARK_PM === this.WORKER) {
            debug('lib/pm.js -PM.run() calling worker to init this worker ... ');
            role = this.WORKER;
            worker(this.config);
        }
        else if (process.env.LARK_PM === this.MASTER) {
            debug('lib/pm.js - PM.run() calling master to fork workers ... ');
            role = this.MASTER;
            master(this.config, this.WORKER);
        }
        else if (process.env.LARK_PM === this.DAEMON) {
            role = this.DAEMON;
            if (args.isStop) {
                debug('lib/pm.js - PM.run() calling daemon.stop() to stop runing processes ... ');
                writable.write('Stopping application ...\n');
                var emitter = daemon.stop();
                emitter.once('error', error => {
                    writable.write("Error: Can not stop, " + error.message + " \n")
                    process.exit(1);
                });
                emitter.once('stop', () => {
                    writable.write("Stopped!\n");
                    process.exit(0);
                });  
            }
            else if (args.isList) {
                debug('lib/pm.js - PM.run() calling daemon.list() to show runing processes ... ');
                writable.write('Listing application status ...\n');
                daemon.list().then(format => {
                    writable.write(daemon.beautify(format) + "\n");
                    daemon.start(this.MASTER);
                })
                .catch(error => {
                    writable.write(error.message + "\n");
                    writable.write(error.stack + "\n");
                    daemon.start(this.MASTER);
                });
            }
            else {
                debug('lib/pm.js - PM.run() calling daemon.run() to run as daemon in background ... ');
                writable.write('Starting application ...\n');
                var emitter = daemon.start(this.MASTER);
                emitter.once('error', error => {
                    writable.write("Error: Can not start, " + error.message + " \n")
                    process.exit(1);
                });
                process.nextTick(() => {
                    writable.write("Started!\n");
                    process.exit(0)
                });
            }
        }
        else {
            if (this.config && this.config.background === true) {
                process.env.LARK_PM = this.DAEMON;
            }
            else {
                process.env.LARK_PM = this.MASTER;
            }
            debug('lib/pm.js - PM.run() no environment LARK_PM found, will try start again ...');
            return this.run();
        }

        started = true;
        debug('lib/pm.js - PM.run() returned');
        return this;
    },

    get isDaemon () {
        this.run();
        return this.ROLE === this.DAEMON;
    },
    get isMaster () {
        this.run();
        return this.ROLE === this.MASTER;
    },
    get isWorker () {
        this.run();
        return this.ROLE === this.WORKER;
    },

    worker (handler) {
        if (this.isWorker) {
            handler();
        }
    },
    master (handler) {
        if (this.isMaster) {
            handler();
        }
    },
    deamon (handler) {
        if (this.isDaemon) {
            handler();
        }
    },
}, new EventEmitter());

PM.configure();

debug("lib/pm.js loaded!");
export default PM;
