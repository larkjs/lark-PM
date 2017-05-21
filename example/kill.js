/**
 * Stop the running app
 **/
const LarkPM = require('..');

const pm = new LarkPM('app.js');

pm.kill().then(() => {
    console.log("KILLED");
}).catch((error) => {
    console.log(error.stack);
});
