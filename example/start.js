/**
 * Stop the running app
 **/
const LarkPM = require('..');

const pm = new LarkPM('app.js', {
    restarts: 2,
    instances: 2,
});

pm.start().then(() => {
    console.log("STARTED");
}).catch((error) => {
    console.log(error.stack);
});
