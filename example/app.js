'use strict';

const http  = require('http');

http.createServer((req, res) => {
    res.write(`worker pid ${process.pid} is working for you`);
    res.end();
}).listen(3000, () => console.log(`worker pid ${process.pid} listening on 3000 ...`));
