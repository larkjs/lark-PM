'use strict';

import _debug   from 'debug';
import http     from 'http';
import PM       from '..';

const debug = _debug('lark-PM');

const server = http.createServer((req, res) => {
    console.log(process.pid + ' has recieved a request');
    res.write(process.pid + ' is at your service');
    res.end();
});

PM.configure({
    'root': process.env.HOME,
    'background': true,
    'instances': 4,
});

debug('examples/app.js testing PM role');
if (PM.isWorker) {
    debug('examples/app.js PM role is WORKER');
    server.listen(3000);
    console.log('Server ' + process.pid + ' has started listening at 3000');
}
else if (PM.isMaster) {
    debug('examples/app.js PM role is MASTER');
    PM.on('start', () => console.log("Service started !"));
    PM.on('stop', () => console.log("Service stopped !"));
}
else if (PM.isDaemon) {
    debug('examples/app.js PM role is DAEMON');
}
else {
    debug('examples/app.js PM role is NOT SET');
}

debug('examples/app.js loaded!');
