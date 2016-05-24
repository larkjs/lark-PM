# lark-pm
==============

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][npm-url]

Process manager of Lark Apps (or other node apps)

# Install

```
$ npm install lark-PM
```

# Get started

```
const pm = require('lark-PM');
const http = require('http');

/**
 * configure pm
 **/
/*
pm.configure({
  'background': false,
  'instances': 1,
  'log-file': 'logs/process_management.log',
  'daemon-dirname': __dirname,
});
*/

if (pm.isWorker) {
    http.createServer((req, res) => {
      res.write("Hello, " + process.pid + " is working for you");
      res.end();
    }).listen(3000);
}

```

then type `node app.js`, you'll get the app.js runing in foreground with one worker (and one master)

# App status control

If you configure the `pm` with `{ background: true }`, your app will be runing in background with forever.js

In this case, use the following commands to control your app

* `$ node app.js --lark-stop` stop the app processes, including daemon, master and all workers
* `$ node app.js --lark-status` show the app status
* 
# LICENCE
MIT

[npm-image]: https://img.shields.io/npm/v/lark-PM.svg?style=flat-square
[npm-url]: https://npmjs.org/package/lark-PM
[downloads-image]: https://img.shields.io/npm/dm/lark-PM.svg?style=flat-square
