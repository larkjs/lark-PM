/**
 * Stop the running app
 **/
const LarkPM = require('..');

const pm = new LarkPM('app.js');

pm.restart().then(() => {
    console.log("RESTARTED");
}).catch((error) => {
    console.log(error.stack);
});
