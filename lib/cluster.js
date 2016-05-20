'use strict';

import $        from 'lodash';
import _debug   from 'debug';
import cluster  from 'cluster';
import os       from 'os';

const debug = _debug('lark-PM');

function main (config, WORKER) {
    function fork () {
        let worker = cluster.fork({
            LARK_PM: WORKER,
        });
        debug('lib/cluster.js - cluster() forking worker with pid ' + worker.process.pid + ' ... ');
    }

    debug('lib/cluster.js - cluster() called');
    if (!cluster.isMaster) {
        return cluster;
    }
    let schedulingPolicy = $.isString(config.schedulingPolicy) ? config.schedulingPolicy.toLowerCase() : "";
    schedulingPolicy = schedulingPolicy.toLowerCase() !== 'roundrobin' ? cluster.SCHED_NONE : cluster.SCHED_RR;
    cluster.schedulingPolicy = schedulingPolicy;
    debug('lib/cluster.js - cluster() setting up master');
    cluster.setupMaster();

    let instances = Math.max(Math.round(config.instances) || os.cpus().length, 1)
    debug('lib/cluster.js - cluster() starting to fork ' + instances + ' worker instances ... ');
    for (let i = 0; i < instances; i++) {
        fork();
    }
    cluster.on('exit', (worker, code, signal) => {
        debug('lib/cluster.js - cluster.on("exit") emitted by worker with pid ' + worker.process.pid);
        if (code === 0) {
            debug('lib/cluster.js - cluster.on("exit") code is 0, exit as expected');
            return;
        }
        debug('lib/cluster.js - cluster.on("exit") code is ' + code + ', exit unexpected, restarting ... ');
        fork();
    });
    return cluster;
};

debug('lib/cluster.js load!');
export default main;
