/**
 * Stop the running app
 **/
const LarkPM  = require('..');
const LarkLog = require('lark-log');

const pm = new LarkPM('app.js');
let logger = new LarkLog();

pm.exit().then(() => {
    logger.log('EXITED');
}).catch((error) => {
    logger.log(error.stack);
});
