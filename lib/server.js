'use strict';

const debug   = require('debug')('lark-pm.daemon-server');
const del     = require('del');
const fs      = require('fs');
const http    = require('http');
const mkdirp  = require('mkdirp');
const path    = require('path');
const url     = require('url');
const Daemon  = require('./Daemon');

const script = process.argv[2];
const daemon = new Daemon(script);

const save = () => {
    mkdirp.sync(path.dirname(daemon.script.options.pidfile));
    fs.writeFileSync(daemon.script.options.pidfile, process.pid);
};

debug('save pid');
let saves = setInterval(save, 5000);
save();
saves.unref();

process.on('exit', () => {
    debug('removing pid and sock files');
    daemon.logger.notice(`server exited`);
    del.sync(daemon.script.options.pidfile);
    del.sync(daemon.script.options.sockfile);
});


mkdirp.sync(path.dirname(daemon.script.options.sockfile));
http.createServer((req, res) => {
    let { pathname, query } = url.parse(req.url, true);
    let command = pathname.slice(1);
    debug(`receives ${command}`);
    daemon.logger.notice(`command: ${command}`);
    let exiting = false;
    if (command === 'exit') {
        exiting = true;
        command = 'stop';
    }
    daemon.command(command, query).then(result => {
        res.write(JSON.stringify({ status: 'OK', result }));
        res.end();
        exiting && process.exit(0);
    }).catch(e => {
        daemon.logger.error(e.stack);
        res.write(JSON.stringify({ status: 'ERROR', message: e.message }));
        res.end();
        exiting && process.exit(1);
    });
}).listen(daemon.script.options.sockfile, () => {
    debug('server started, detaching ... goodby');
    daemon.logger.notice(`server started`);
    process.send('OK');
});

// setTimeout(() => process.exit(), 10000);
