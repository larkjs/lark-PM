'use strict';

import $          from 'lodash';
import _debug     from 'debug';
import _forever   from 'forever';
import bytes      from 'bytes';
import chalk      from 'chalk';
import mkdirp     from 'mkdirp';
import net        from 'net';
import fs         from 'fs';
import path       from 'path';
import table      from 'table';
import dateFormat from 'date-format';

const debug = _debug('lark-PM');

let script = process.mainModule.filename;
let scriptDirname = null;
let daemonDirname = null;
let config = {};

function forever () {
    _forever.load({ root: daemonDirname });
    return _forever;
}

function masterClient () {
    let sockFile = path.join(scriptDirname, '.' + path.basename(script) + '.sock');
    let client = net.createConnection(sockFile);
    client.on('error', error => {});
    return client;
}

const daemon = {
    configure (customConfig = {}) {
        debug('lib/daemon.js - daemon.configure() called');
        config = $.merge(config, customConfig);

        script = config.script || process.mainModule.filename;
        if (!path.isAbsolute(script)) {
            script = path.join(path.dirname(process.mainModule.filename), script);
        }
        scriptDirname = path.dirname(script);

        daemonDirname = config['daemon-dirname'] || path.dirname(script);
        if (!$.endsWith(daemonDirname, '.forever')) {
            daemonDirname = path.join(daemonDirname, '.forever');
        }
        return this;
    },
    start (MASTER) {
        this.stop().once('error', error => debug('lib/daemon.js - daemon.start() calling daemon.stop() failed : ' + error.message));
        debug('lib/daemon.js - daemon.start() called');

        let logFile = config['log-file'] || 'logs/process_management.log';
        let errLogFile = config['err-log-file'] || logFile;
        if (!path.isAbsolute(logFile)) {
            logFile = path.join(scriptDirname, logFile);
        }
        if (!path.isAbsolute(errLogFile)) {
            errLogFile = path.join(scriptDirname, errLogFile);
        }

        mkdirp.sync(path.dirname(logFile));
        mkdirp.sync(path.dirname(errLogFile));
        mkdirp.sync(daemonDirname);

        debug('lib/daemon.js - daemon() starting script with forever ... ');
        const options = {
            'slient': config.slient === false ? false : true,
            'uid': script,
            'killTree': true,
            'args': process.argv.slice(2),
            'env': {
                'LARK_PM': MASTER,
                'LARK_PM_BACKGROUND': true,
            },
            'cwd': scriptDirname,
            'pidFile': path.join(scriptDirname, '.' + path.basename(script) + '.pid'),
            'logFile': logFile,
            'outFile': logFile,
            'errFile': errLogFile,
            'command': process.execPath + " " + process.execArgv.join(' '),
        };
        return forever().startDaemon(script, options);
    },
    restart () {
        return this.start();
    },
    stop () {
        debug('lib/daemon.js - daemon.stop() called');
        debug('lib/daemon.js - daemon() stopping script with forever ... ');
        let client = masterClient();
        client.on('error', error => {});
        client.write('stop\r\n');
        client.end();
        return forever().stop(script);
    },
    list () {
        debug('lib/daemon.js - daemon.list() called');
        
        debug('lib/daemon.js - daemon() listing script with forever ... ');
        let daemon = new Promise((resolve, reject) => {
            forever().list(false, (error, processList) => {
                processList = processList || [];
                let result = null;
                for (let process of processList) {
                    if (process.file === script) {
                        result = process;
                        break;
                    }
                }
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });

        debug('lib/daemon.js - daemon() listing workers ... ');
        let workers = new Promise((resolve, reject) => {
            let client = masterClient();
            client.write('status\r\n');
            
            let data = [];
            client.on('data', chunk => data.push(chunk));
            client.on('end', () =>{
                let result = Buffer.concat(data).toString();
                try {
                    result = JSON.parse(result);
                }
                catch (e) {
                    return resolve([]);
                }
                resolve(result);
            });
            client.on('error', error => resolve([]));
        });

        return Promise.all([daemon, workers]).then((result) => {
            let processes = [];
            result[0] && processes.push(result[0]);
            for (let worker of result[1]) {
                worker.isMaster = false;
                processes.push(worker);
            }
            return Promise.resolve(processes);
        });
    },
    status () {
        return this.list();
    },
    beautify (list = null) {
        let appname = script;
        if (appname.indexOf(process.env.HOME) === 0) {
            appname = '~' + appname.slice(process.env.HOME.length);
        }

        let title = chalk.cyan("Application : " + appname + "\n");
        let show = [['Role', 'PID', 'Restarts', 'Memory Usage', 'Online Time']];
        if (!Array.isArray(list) || list.length === 0) {
            return chalk.cyan(title + table(show));
        }

        for (let process of list) {
            show.push([
                process.isMaster ? 'Master' : 'Worker',
                process.pid,
                process.restarts === 0 ? process.restarts : process.restarts,
                process.memory ? bytes(process.memory) : '-',
                dateFormat('yyyy-MM-dd hh:mm:ss', new Date(process.ctime)),
            ]);
        }
        return chalk.cyan(title + table(show));
    }
}

daemon.configure();

debug('lib/daemon.js load');
export default daemon;
