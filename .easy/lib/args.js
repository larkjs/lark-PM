'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('lark-PM');

var config = {
    'control-prefix': '--lark-'
};

var commands = ['start', 'stop', 'restart', 'status', 'list', 'kill'];

var command = null;

var args = {
    get config() {
        return _lodash2.default.cloneDeep(config);
    },
    configure: function configure(config) {
        config = _lodash2.default.merge(config, config);
    },

    get command() {
        if (!command) {
            for (var _iterator = process.argv, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
                var _ref;

                if (_isArray) {
                    if (_i >= _iterator.length) break;
                    _ref = _iterator[_i++];
                } else {
                    _i = _iterator.next();
                    if (_i.done) break;
                    _ref = _i.value;
                }

                var argv = _ref;

                if (argv.search(this.config['control-prefix']) === 0) {
                    var _command = argv.slice(config['control-prefix'].length);
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
    get isStart() {
        return this.command === 'start';
    },
    get isStop() {
        return this.command === 'stop';
    },
    get isRestart() {
        return this.command === 'restart';
    },
    get isStatus() {
        return this.command === 'status' || this.command === 'list';
    },
    get isList() {
        return this.command === 'status' || this.command === 'list';
    },
    get isKill() {
        return this.command === 'kill';
    }
};

exports.default = args;