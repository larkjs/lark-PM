'use strict';

import _debug   from 'debug';
import http     from 'http';
import path     from 'path';
import PM       from '..';

const debug = _debug('lark-PM');

//for mocha test
process.mainModule.filename = path.join(__filename);

const server = http.createServer((req, res) => {
    console.log(process.pid + ' has recieved a request');
    res.write(process.pid + ' is at your service');
    res.end();
});

PM.configure({
    'daemon-dirname': process.env.HOME,
    'log-file':path.join(__dirname, 'logs/process.log'),
    'background': true,
    // 'instances': 2,
    'memory': 1 * 1024 * 1024, // 1GB
    'control-prefix': '--lark-',
});

PM.run().then(PM => {

    debug('examples/app.js testing PM role');
    if (PM.isWorker) {
        debug('examples/app.js PM role is WORKER');
        server.listen(3000);
        console.log('Server ' + process.pid + ' has started listening at 3000');
    }
    else if (PM.isMaster) {
        debug('examples/app.js PM role is MASTER');
    }
    else if (PM.isDaemon) {
        debug('examples/app.js PM role is DAEMON');
    }
    else {
        debug('examples/app.js PM role is NOT SET');
    }

}).catch(error => console.log(error.stack));

debug('examples/app.js loaded!');
