'use strict';

import $        from 'lodash';
import _debug   from 'debug';
import cluster  from 'cluster';
import fs       from 'fs';
import net      from 'net';
import os       from 'os';
import path     from 'path';

import daemon   from './daemon';

const debug = _debug('lark-PM');

function main (config, WORKER) {
    if (!cluster.isMaster) {
        throw new Error("Internal Error");
    }

    function fork () {
        let worker = cluster.fork({
            LARK_PM: WORKER,
        });
        worker.process.ctime = Date.now();
        worker.on('message', message => {
            worker.process.heapUsed = message.memory.heapUsed;
        });
        debug('lib/master.js - master() forking worker with pid ' + worker.process.pid + ' ... ');
        return worker;
    }

    debug('lib/master.js - master() called');

    let schedulingPolicy = $.isString(config.schedulingPolicy) ? config.schedulingPolicy.toLowerCase() : "";
    schedulingPolicy = schedulingPolicy.toLowerCase() !== 'roundrobin' ? cluster.SCHED_NONE : cluster.SCHED_RR;
    cluster.schedulingPolicy = schedulingPolicy;
    debug('lib/master.js - master() setting up master');
    cluster.setupMaster();

    config.instances = config.instances || 1;
    if ($.isString(config.instances) && config.instances.trim().toLowerCase() === 'max') {
        config.instances = os.cpus();
    }
    let instances = Math.max(Math.round(config.instances), 1);
    debug('lib/master.js - master() starting to fork ' + instances + ' worker instances ... ');

    for (let i = 0; i < instances; i++) {
        let worker = fork();
        worker.process.restarts = 0;
    }

    cluster.on('exit', (worker, code, signal) => {
        debug('lib/master.js - cluster.on("exit") emitted by worker with pid ' + worker.process.pid);
        if (code === 0) {
            debug('lib/master.js - cluster.on("exit") code is 0, exit as expected');
            if (Object.keys(cluster.workers).length === 0) {
                debug('lib/master.js - cluster.on("exit") no worker is running, master exiting ... ');
                if (process.env.LARK_PM_BACKGROUND) {
                    daemon.stop().once('error', error => console.log(error.message));
                }
                else {
                    process.exit(0);
                }
            }
            return;
        }
        debug('lib/master.js - cluster.on("exit") code is ' + code + ', exit unexpected, restarting ... ');
        let newWorker = fork();
        newWorker.process.restarts = worker.process.restarts + 1;
    });

    setInterval(() => {
        for (let id in cluster.workers) {
            let worker = cluster.workers[id];
            worker.send('status');
        }
    }, 5000);

    cli();
    return cluster;
};

function getWorkerStatus () {
    let workers = [];
    for (let id in cluster.workers) {
        let worker = cluster.workers[id];
        workers.push({
            id: worker.id,
            file: process.mainModule.filename,
            state: worker.state,
            memory: worker.process.heapUsed,
            pid: worker.process.pid,
            ctime: worker.process.ctime,
            restarts: worker.process.restarts,
        });
    }
    return workers;
}

function cli () {
    let socketFile = path.join(path.dirname(process.mainModule.filename), '.worker_status.sock');
    let server = net.createServer(socket => {
        let data = "";
        socket.on('data', chunk => {
            data = data + chunk;
            if (!$.endsWith(data, '\r\n')) {
                return;
            }
            data = data.trim();
            if (data === 'status') {
                socket.write(JSON.stringify(getWorkerStatus()));
                socket.end();
            }
            else if (data.indexOf('message:') === 0) {
                let message = data.slice('message'.length);
                process.emit('daemon-message', message, (result = "") => {
                    socket.write(result);
                    socket.end();
                });
            }
        });
    }).listen(socketFile);;
    process.on('exit', () => server.close());
}

debug('lib/master.js load!');
export default main;
