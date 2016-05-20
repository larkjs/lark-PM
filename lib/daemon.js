'use strict';

import $        from 'lodash';
import _debug   from 'debug';
import mkdirp   from 'mkdirp';
import forever  from 'forever';
import fs       from 'fs';
import path     from 'path';

const debug = _debug('lark-PM');

const script = process.mainModule.filename;
let dirname = path.dirname(script);
let foreverDirname = path.join(dirname, '.forever');
let config = {};

const daemon = {
    configure (customConfig) {
        debug('lib/daemon.js - daemon.configure() called');
        if ($.isString(customConfig.root)) {
            if (!path.isAbsolute(customConfig.root) || !fs.statSync(customConfig.root).isDirectory()) {
                throw new Error('Root should be an absolute path of a directory');
            }
            dirname = customConfig.root;
            foreverDirname = path.join(dirname, '.forever');
        }
        config = $.merge(config, customConfig);
        config.root = foreverDirname;

        forever.load({ root: config.root });
        return this;
    },
    start (MASTER) {
        debug('lib/daemon.js - daemon.start() called');

        let logFile = config.logFile || 'logs/process_management.log';
        if (!path.isAbsolute(logFile)) {
            logFile = path.join(dirname, logFile);
        }
        mkdirp.sync(path.dirname(logFile));

        mkdirp.sync(foreverDirname);
        debug('lib/daemon.js - daemon() starting script with forever ... ');
        const options = {
            'slient': config.slient === false ? false : true,
            'uid': script,
            'killTree': true,
            'env': {
                'LARK_PM': MASTER,
            },
            'cwd': path.dirname(script),
            'logFile': logFile,
            'outFile': logFile,
            'errFile': logFile,
        };
        forever.startDaemon(script, options);
        return this;
    },
    stop () {
        debug('lib/daemon.js - daemon.stop() called');
        debug('lib/daemon.js - daemon() stopping script with forever ... ');
        forever.stop(script);
    },
    list (callback) {
        debug('lib/daemon.js - daemon.list() called');
        debug('lib/daemon.js - daemon() listing script with forever ... ');
        forever.list(false, callback);
    }
}

debug('lib/daemon.js load');
export default daemon;
