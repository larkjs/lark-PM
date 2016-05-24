'use strict';

import _debug   from 'debug';
import path     from 'path';
import PM       from '..';

const debug = _debug('lark-PM');

PM.configure({
    'daemon-dirname': process.env.HOME,
    'script': path.join(__dirname, 'app.js'),
    'logFile':path.join(__dirname, 'logs/process.log'),
    'background': true,
    'instances': 4,
});

PM.daemon.list().then(result => {
    console.log(result);
});
