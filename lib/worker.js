'use strict';

const debug   = require('debug')('lark-pm.worker');
const assert  = require('assert');
const cluster = require('cluster');
const cp      = require('child_process');
const misc    = require('vi-misc');

class Worker {
    constructor(id, daemon) {
        this.id = id;
        this.daemon = daemon;
        this.updateTime = null;
        this.startTime = Date.now();
        this.restarts = 0;
    }

    status() {
        return {
            id: this.id,
            startTime: this.startTime,
            updateTime: this.updateTime,
            state: this.state,
            restarts: this.restarts,
        };
    }

    set state(state) {
        assert(['OFFLINE', 'STARTING', 'ONLINE', 'STOPPING', 'EXIT', 'ERROR'].includes(state),
            `Invalid state ${state}`);
        this._state = state;
        this.updateTime = Date.now();
        this.daemon.logger.notice(`worker ${this.id} state to ${state}`);
    }

    get state() {
        return this._state;
    }

    async start() {
        debug(`starting worker ${this.id}`);
        if (this.state === 'ERROR') {
            return;
        }
        let restartLimit = this.daemon.script.options.restarts;
        if (this.state === 'EXIT' && this.restarts >= restartLimit &&
            Date.now() - this.startTime < restartLimit * this.daemon.script.options.timeout ) {
            this.state = 'ERROR';
            return;
        }
        this.restarts++;
        this.instance = cluster.fork();
        this.state = 'STARTING';
        await this.started();
        
        this.instance.once('exit', code => this.onExit(code));
    }

    async started() {
        if (this.state === 'ONLINE') {
            return true;
        }
        await new Promise((resolve, reject) => {
            let [res, rej] = misc.function.once(resolve, reject);
            this.instance.once('online', () => res());
            this.instance.once('error', (error) => rej(error));
        });
        this.state = 'ONLINE';
    }

    async stop() {
        if (this.state === 'OFFLINE' || this.state === 'EXIT') {
            return true;
        }
        if (this.state === 'STARTING') {
            debug(`worker ${this.id} is starting, waiting ...`);
            await this.started();
        }
        if (this.state === 'STOPPING') {
            await this.stopped();
            return;
        }
        if (!(this.instance instanceof cluster.Worker)) {
            return;
        }
        debug(`stopping worker ${this.id}`);
        this.state = 'STOPPING';
        this.instance.disconnect();
        try {
            await this.stopped();
        }
        catch (e) {
            let pid = this.instance.process.pid;
            cp.execSync(`kill -9 ${pid}`);
        }
        return true;
    }

    async stopped() {
        if (this.state === 'OFFLINE' || this.state === 'EXIT') {
            return true;
        }
        await new Promise((resolve, reject) => {
            let [res, rej] = misc.function.once(resolve, reject);
            this.instance.once('disconnect', res);
            this.instance.once('exit', res);
            this.instance.once('error', rej);
            setTimeout(() => rej(new Error('Stopping Timeout')), 2000);
        });
        this.state = 'OFFLINE';
    }

    onExit(code = 0) {
        this.instance = null;
        if (this.state !== 'OFFLINE' && this.state !== 'STOPPING') {
            this.state = 'EXIT';
        }
        if (code === 0 || this.state === 'OFFLINE' || this.state === 'STOPPING') {
            this.daemon.logger.notice(`worker ${this.id} finished, code ${code}`);
            return;
        }
        this.daemon.logger.notice(`worker ${this.id} exited unexpectly, restarting ...`);
        this.start();
    }
}

module.exports = Worker;
