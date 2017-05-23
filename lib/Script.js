/**
 * The config parsed for the script
 **/
'use strict';

const assert  = require('assert');
const debug   = require('debug')('lark-pm.config');
const extend  = require('extend');
const fs      = require('fs');
const mkdirp  = require('mkdirp');
const misc    = require('vi-misc');
const path    = require('path');

const DIRNAME   = '.lark-pm';
const SOCKFILE  = 'daemon.sock';
const PIDFILE   = 'daemon.pid';
const TRACELOG  = 'trace.log';
const ERRORLOG  = 'error.log';

const DEFAULT_TIMEOUT = 10000; // 10s
const DEFAULT_RESTART_LIMIT = 15; // if restart 15 times in a short time, then throws error
const DEFAULT_INSTANCES = 'max';

class Config {

    constructor(script, options = {}) {
        debug('initializing config');

        let scriptPath  = misc.path.absolute(script);

        try {
            let stat = fs.statSync(scriptPath);
            assert(stat.isFile());
        }
        catch (e) {
            throw new Error(`No script found at ${scriptPath}`);
        }

        this.path       = scriptPath;
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

        this.options.pidfile  = this._defaultPath(this.options.pidfile, PIDFILE);
        this.options.sockfile = this._defaultPath(this.options.sockfile, SOCKFILE);
        this.options.timeout  = this.options.timeout || DEFAULT_TIMEOUT;
        this.options.restarts = this.options.restarts || DEFAULT_RESTART_LIMIT;
        this.options.instances  = this.options.instances || DEFAULT_INSTANCES;
        this.options.tracelog = this._defaultPath(this.options.tracelog, TRACELOG);
        this.options.errorlog = this._defaultPath(this.options.errorlog, ERRORLOG);

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
