'use strict';

const debug   = require('debug')('lark-pm.daemon');
const assert  = require('assert');
const cluster = require('cluster');
const os      = require('os');
const LarkLog = require('lark-log');
const Script  = require('./Script');
const Worker  = require('./Worker');

class Daemon {
    constructor(script) {
        this.script = new Script(script);
        this.logger = new LarkLog({
            outputs: {
                system: { path: this.script.options.tracelog },
                error: { path: this.script.options.errorlog },
            },
        });
        cluster.setupMaster({
            exec: this.script.path,
            stdio: ['ipc', this.logger.outputs.system.stream, this.logger.outputs.error.stream],
        });
        this.workers = new Map();
        cluster.on('error', (error) => this.daemon.logger.error(error.stack));
    }

    async command(command) {
        debug(`on command ${command}`);
        switch (command) {
        case 'ping':
            this.pong();
            return;
        case 'start':
            await this.start();
            return;
        case 'stop':
            await this.stop();
            return;
        case 'restart':
            await this.stop();
            await this.start();
            return;
        case 'status':
            return this.status();
        default:
            this.unknow();
            return;
        }
    }

    pong() {
        debug('pong');
        return 'pong';
    }

    async start() {
        debug('start');
        if (this.workers.size !== 0) {
            await this.stop();
        }
        assert(this.workers.size === 0, `Application ${this.script.appname} is already running`);
        let instances = [0, 'max'].includes(this.script.options.instances) ?
            os.cpus().length : parseInt(this.script.options.instances, 10);
        assert(instances > 0, 'Instances for app should be no less than 1');
        this.state = 'STARTING';
        let queue = [];
        for (let id = 1; id <= instances; id++) {
            let worker = new Worker(id, this);
            this.workers.set(id, worker);
            queue.push(worker.start());
        }
        await Promise.all(queue);

        return true;
    }

    async stop() {
        debug('stop');
        if (this.workers.size === 0) {
            return true;
        }
        let queue = [];
        for (let worker of this.workers.values()) {
            queue.push(worker.stop());
        }
        await Promise.all(queue);
        this.workers = new Map();

        return true;
    }

    status() {
        debug('status');

        let daemon = {
            name: this.script.appname,
            path: this.script.path,
        };

        let workers = [];
        for (let worker of this.workers.values()) {
            workers.push(worker.status());
        }
        return { daemon, workers };
    }

    unknow() {
        throw new Error('Unknow command');
    }
}

module.exports = Daemon;
