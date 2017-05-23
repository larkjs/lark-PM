'use strict';

const http    = require('http');
const path    = require('path');

let server = http.createServer((req, res) => {
    res.write(`worker pid ${process.pid} is working for you`);
    console.log(`worker pid ${process.pid} received ${req.method} ${req.url}`);
    res.end();
});

server.listen(3000, () => console.log(`worker pid ${process.pid} listening on 3000 ...`));
