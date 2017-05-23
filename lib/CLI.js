'use strict';

const chalk     = require('chalk');
const commander = require('commander');
const path      = require('path');
const table     = require('table');
const Duration  = require('duration');
const LarkPM    = require('..');

const pkg       = require('../package.json');

function log(message, noTime = false) {
    let prefix = '';
    if (!noTime) {
        let time = new Date().toTimeString().slice(0, 8);
        prefix = `${chalk.gray(time)}  -  `;
    }
    process.stdout.write(`${prefix}${chalk.yellow(message)}\n`);
}


commander
    .version(pkg.version)
    .usage('<command> [options] <script>')
    .option('-p, --pidfile <pidfile>', 'Set the file to store daemon pid')
    .option('-s, --sockfile <sockfile>', 'Set the sock file for the daemon')
    .option('-t, --timeout <timeout>', 'Set the timeout for commands')
    .option('-r, --restarts <restarts>', 'Mark the process as error if restarts more than this number in a short time')
    .option('-i, --instances <instances>', 'Set the number of workers, may be a number greater than 0 or max')
    .option('-l, --tracelog <tracelog>', 'Set the trace log path')
    .option('-e, --errorlog <errorlog>', 'Set the error log path');

function options() {
    return {
        pidfile:    absolute(commander.pidfile),
        sockfile:   absolute(commander.sockfile),
        timeout:    commander.timeout,
        restarts:   commander.restarts,
        instances:  commander.instances,
        tracelog:   absolute(commander.tracelog),
        errorlog:   absolute(commander.errorlog),
    };
}

function absolute(script) {
    if (!script) {
        return null;
    }
    if (path.isAbsolute(script)) {
        return script;
    }
    return path.join(process.cwd(), script);
}

async function command(script, action, doing, done) {
    log(`${doing} ${script}`);
    let result = null;
    script = absolute(script);
    try {
        const pm = new LarkPM(script, options());
        result = await pm[action]();
    }
    catch (error) {
        log(`ERROR: ${error.message}`);
        if (process.env.DEBUG) {
            log(error.stack, true);
        }
        return null;
    }
    log(`${done}`);
    return result;
}
commander
    .command('start <script>')
    .description('start an application')
    .action((script) => {
        command(script, 'start', 'STARTING', 'STARTED');
    });

commander
    .command('stop <script>')
    .description('stop an application (will leave daemon alive)')
    .action((script) => {
        command(script, 'stop', 'STOPPING', 'STOPPED');
    });

commander
    .command('restart <script>')
    .description('restart an application')
    .action((script) => {
        command(script, 'restart', 'RESTARTING', 'RESTARTED');
    });

commander
    .command('kill <script>')
    .description('force to kill an application and daemon')
    .action((script) => {
        command(script, 'kill', 'KILLING', 'KILLED');
    });

commander
    .command('exit <script>')
    .description('stop an application and shut down daemon gently')
    .action((script) => {
        command(script, 'exit', 'EXITING', 'EXITED');
    });

commander
    .command('show <script>')
    .description('show the status of an application')
    .action((script) => {
        command(script, 'status', 'SHOWING', 'STATUS').then((result) => {
            let data = [['id', 'start time', 'update time', 'state', 'online duration', 'restarts']];
            let format = (time) => {
                let date = new Date(time);
                return `${date.toLocaleDateString()} ${date.toTimeString().slice(0, 8)}`;
            };
            for (let worker of result.workers) {
                let state = worker.state;
                if (state === 'ONLINE') {
                    state = chalk.blue(state);
                }
                else if (state === 'OFFLINE' || state === 'EXIT') {
                    state = chalk.gray(state);
                }
                else if (state === 'ERROR') {
                    state = chalk.red(state);
                }
                else {
                    state = chalk.cyan(state);
                }

                data.push([worker.id, format(worker.startTime), format(worker.updateTime),
                    state, new Duration(new Date(worker.startTime)).toString(0, 1), worker.restarts]);
            }
            log(chalk.blue(`APP NAME: ${result.daemon.name}`), true);
            log(chalk.white(table.table(data)), true);
        });
    });

commander
    .command('*', 'show usage')
    .action(() => commander.outputHelp());

if (process.argv.length <= 2) {
    commander.outputHelp();
}
else {
    commander.parse(process.argv);
}
