/**
 * Stop the running app
 **/
const LarkPM = require('..');

const pm = new LarkPM('app.js');

pm.status().then((status) => {
    console.log("STATUS:");
    console.log(status);
}).catch((error) => {
    console.log(error.stack);
});
