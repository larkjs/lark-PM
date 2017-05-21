/**
 * Stop the running app
 **/
const LarkPM = require('..');

const pm = new LarkPM('app.js');

pm.exit().then(() => {
    console.log("EXITED");
}).catch((error) => {
    console.log(error.stack);
});
