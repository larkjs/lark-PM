/**
 * Tests for lark-pm
 **/
'use strict';

const got     = require('got');
const path    = require('path');
const LarkPM  = require('..');

describe('creating a process manager', () => {
    it('should not throw errors', async () => {
        let pm = new LarkPM(path.join(__dirname, '../example/app.js'));
    });

    it('should throw errors if app not exit', async () => {
        let error = {};
        try {
            let pm = new LarkPM(path.join(__dirname, '../example/app-not-exist.js'));
        }
        catch (e) {
            error = e;
        }
        error.should.be.an.instanceof(Error);
    });
});

describe('starting an app with process manager', () => {
    let pid = null;

    it('should start the app', async () => {
        let pm = new LarkPM(path.join(__dirname, '../example/app.js'));
        await pm.start();
        await new Promise(resolve => setTimeout(resolve, 500));
        let result = await got('localhost:3000',
            { timeout: 1000, retries: 0, query: {}});
        let matches = result.body.match(/worker pid (\d+) is working for you/);
        matches.should.be.ok;
        pid = matches[1];
    });

    it('should stop the app', async () => {
        let pm = new LarkPM(path.join(__dirname, '../example/app.js'));
        await pm.stop();
        let error = {};
        try {
            let result = await got('localhost:3000',
                { timeout: 1000, retries: 0, query: {}});
        }
        catch (e) {
            error = e;
        }
        error.should.be.an.instanceof(Error);
    });

    it('should restart the app', async () => {
        let pm = new LarkPM(path.join(__dirname, '../example/app.js'));
        await pm.restart();
        await new Promise(resolve => setTimeout(resolve, 500));
        let result = await got('localhost:3000',
            { timeout: 1000, retries: 0, query: {}});
        let matches = result.body.match(/worker pid (\d+) is working for you/);
        matches.should.be.ok;
        matches[1].should.not.be.exactly(pid);
    });

    it('should kill the app', async () => {
        let pm = new LarkPM(path.join(__dirname, '../example/app.js'));
        await pm.kill();
        let error = {};
        try {
            let result = await got('localhost:3000',
                { timeout: 1000, retries: 0, query: {}});
        }
        catch (e) {
            error = e;
        }
        error.should.be.an.instanceof(Error);
    });
});
