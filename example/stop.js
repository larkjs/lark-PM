/**
 * Stop the running app
 **/
const LarkPM = require('..');

const pm = new LarkPM('app.js');

pm.stop().then(() => {
    console.log("STOPPED");
}).catch((error) => {
    console.log(error.stack);
});
