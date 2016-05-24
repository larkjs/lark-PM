'use strict';

import $        from 'lodash';
import _debug   from 'debug';
import cluster  from 'cluster';

const debug = _debug('lark-PM');

function main (config) {
    process.on('message', message => {
        switch (message) {
            case 'status' :
                process.send({
                    memory: process.memoryUsage(),
                });
                break;
        }
    });
    if (config.memory) {
        // memory limit should be at least 40MB
        config.memory = Math.max(config.memory, 40 * 1024 * 1024);
        setInterval(() => {
            let memory = process.memoryUsage();
            if (memory.heapUsed > config.memory) {
                console.log("Worker " + process.pid + " exiting due to memory limit ... ");
                process.exit(1);
            }
        }, 5000);
    }
}

debug('lib/worker.js load');
export default main;
