/**
 * Client to manage/command daemon
 **/
'use strict';

const debug   = require('debug')('lark-pm.client');
const assert  = require('assert');
const cp      = require('child_process');
const del     = require('del');
const fs      = require('fs');
const got     = require('got');
const misc    = require('vi-misc');
const path    = require('path');
const Script  = require('./Script');

const DAEMON  = 'server.js';
const STATE_ONLINE  = 'ONLINE';
const STATE_OFFLINE = 'OFFLINE';

class Client {
    constructor(script, options = {}) {
        debug('intializing client');
        this.script = new Script(script, options);
    }

    async ready() {
        if (this._daemonState === STATE_ONLINE) {
            return true;
        }
        debug('getting ready');
        let daemonState = await this.checkDaemonState();
        if (daemonState === STATE_OFFLINE) {
            this.clear();
            await this.spawnDaemon();
        }
        return true;
    }

    async checkDaemonState() {
        if (this._daemonState) {
            return this._daemonState;
        }
        this._daemonState = STATE_OFFLINE;
        let result = false;
        result = await this.checkSockFile();
        if (!result) {
            return this._daemonState;
        }
        result = await this.ping();
        if (!result) {
            return this._daemonState;
        }
        this._daemonState = STATE_ONLINE;
        return this._daemonState;
    }

    async checkSockFile() {
        let stats = null;
        try {
            debug(`check ${this.script.options.sockfile}`);
            stats = fs.statSync(this.script.options.sockfile);
        }
        catch (e) {
            debug('no sock file');
            return false;
        }
        if (!stats.isSocket()) {
            debug('not socket file');
            return false;
        }
        return true;
    }

    async spawnDaemon() {
        debug('spawning daemon');
        const daemon = path.join(__dirname, DAEMON);
        fs.accessSync(daemon);
        let stdio = ['ipc', 'ignore', 'ignore'];
        if (process.env.DEBUG) {
            stdio = ['ipc', process.stdout, process.stderr];
        }
        let child = cp.spawn(process.argv[0], [daemon, this.script.path], { detached: true, stdio });
        debug(`spawn daemon pid: ${child.pid}`);

        this.script.save();
        child.unref();
        return new Promise((resolve, reject) => {
            let [res, rej] = misc.function.once(resolve, reject);
            debug('waiting spawning result');
            let timeout = setTimeout(() => reject(new Error("Spawning timed out")), this.script.options.timeout);
            child.once('error', (error) => {
                clearTimeout(timeout);
                rej(error);
            });
            child.once('message', (message) => {
                debug('child process send a message, spawning succeed, distach child process');
                clearTimeout(timeout);
                child.disconnect();
                res();
            });
            child.once('exit', (code) => {
                clearTimeout(timeout);
                return code === 0 ? res() : rej(new Error('Child process exit', code));
            });
        });
    }

    async command(action, options = {}) {
        debug(`command ${action}`);
        let target = `unix:${this.script.options.sockfile}:/${action}`;
        let response = await got(target, { timeout: this.script.options.timeout, retries: 0, query: options });
        response = JSON.parse(response.body);
        if (response.status === 'OK') {
            return response.result;
        }
        throw new Error(response.message || 'Unknown Daemon Server Error');
    }

    async ping() {
        debug('ping daemon');
        try {
            await this.command('ping');
        }
        catch (e) {
            debug('can not reach daemon');
            return false;
        }
        return true;
    }

    clear() {
        debug('clearing');
        let pid = null;
        try {
            pid = fs.readFileSync(this.script.options.pidfile).toString();
        }
        catch (e) {
            debug('fail to read daemon pid from file');
            pid = null;
        }
        if (pid) {
            debug(`killing  pid ${pid}`);
            cp.execSync(`kill -9 ${pid}`);
        }
        debug('clearing config, pid and sock files');
        del.sync(this.script.configfile);
        del.sync(this.script.options.pidfile);
        del.sync(this.script.options.sockfile);
        return this;
    }

    async start() {
        debug('start');
        await this.ready();
        return await this.command('start');
    }

    async stop() {
        debug('stop');
        await this.ready();
        return await this.command('stop');
    }

    async restart() {
        debug('restart');
        await this.ready();
        return await this.command('restart');
    }

    async kill() {
        debug('kill');
        return await this.clear();
    }

    async exit() {
        debug('exit');
        return await this.command('exit');
    }

    async status() {
        debug('status');
        return await this.command('status');
    }
}

module.exports = Client;
