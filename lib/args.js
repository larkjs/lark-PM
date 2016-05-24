'use strict';

import $      from 'lodash';
import _debug from 'debug';

const debug = _debug('lark-PM');

let config = {
    'control-prefix': '--lark-',
};

const commands = [
  'start',
  'stop',
  'restart',
  'status',
  'list',
  'kill',
];

let command = null;

const args = {
    get config () {
        return $.cloneDeep(config);
    },
    configure (config) {
        config = $.merge(config, config);
    },
    get command () {
        if (!command) {
            for (let argv of process.argv) {
                if (argv.search(this.config['control-prefix']) === 0) {
                    let _command = argv.slice(config['control-prefix'].length);
                    if (commands.indexOf(_command) >= 0) {
                        command = _command;
                        break;
                    }
                }
            }
            command = command || commands[0];
        }
        return command;
    },
    get isStart () {
        return this.command === 'start';
    },
    get isStop () {
        return this.command === 'stop';
    },
    get isRestart () {
        return this.command === 'restart';
    },
    get isStatus () {
        return this.command === 'status' || this.command === 'list';
    },
    get isList () {
        return this.command === 'status' || this.command === 'list';
    },
    get isKill () {
        return this.command === 'kill';
    },
};

export default args;
