/**
 * The config parsed for the script
 **/
'use strict';

const debug   = require('debug')('lark-pm.config');
const extend  = require('extend');
const fs      = require('fs');
const mkdirp  = require('mkdirp');
const misc    = require('vi-misc');
const path    = require('path');

const DIRNAME   = '.lark-pm';
const CONFIG    = 'config.json';
const SOCKFILE  = 'daemon.sock';
const PIDFILE   = 'daemon.pid';

const DEFAULT_TIMEOUT = 10000; // 10s
const DEFAULT_RESTART_LIMIT = 15; // if restart 15 times in a short time, then throws error
const DEFAULT_INSTANCES = 'max';

class Config {

    constructor(script, options = {}) {
        debug('initializing config');

        this.path       = misc.path.absolute(script);
        this.appname    = path.basename(this.path, path.extname(this.path));
        this.main       = path.join(path.dirname(this.path), DIRNAME, this.appname);
        this.configfile = `${this.main}.json`;

        this.options    = extend({}, options, true);
        this.load();
    }

    load() {
        debug(`load from file ${this.configfile}`);
        
        let options = {};
        try {
            options  = fs.readFileSync(this.configfile).toString();
            options = JSON.parse(options);
        }
        catch (e) {
            debug(`no valid config in file ${this.configfile}`);
            options = {};
        }
        this.options = extend(options, this.options, true);

        this.options.pidfile  = this._defaultPath(this.options.pidfile, 'daemon.pid');
        this.options.sockfile = this._defaultPath(this.options.sockfile, 'daemon.sock');
        this.options.timeout  = this.options.timeout || DEFAULT_TIMEOUT;
        this.options.restarts = this.options.restarts || DEFAULT_RESTART_LIMIT;
        this.options.instances  = this.options.instances || DEFAULT_INSTANCES;
        this.options.tracelog = this._defaultPath(this.options.tracelog, 'trace.log');
        this.options.errorlog = this._defaultPath(this.options.errorlog, 'error.log');

        return this;
    }

    save() {
        debug('save into file');
        mkdirp.sync(path.dirname(this.configfile));
        fs.writeFileSync(this.configfile, JSON.stringify(this.options, null, 4));

        return this;
    }

    _defaultPath(value, defaultValue) {
        value = value || path.join(this.main, defaultValue);
        return path.isAbsolute(value) ? value : path.join(path.dirname(this.path), value);
    }

}

module.exports = Config;
