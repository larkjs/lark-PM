'use strict';

import $        from 'lodash';
import _debug   from 'debug';
import should   from 'should';
import cp       from 'child_process';
import got      from 'got';
import path     from 'path';

const app = path.join(__dirname, '../examples/app.js');
const list = path.join(__dirname, '../examples/list.js');

const debug = _debug('lark-PM');

function exec (command) {
    return cp.execSync(command).toString().trim();
}

describe('Lark-PM start ', function () {
    this.timeout(10000);

    it('should start the app with no errors', done => {
        let output = "";
        let error = null;
        try {
            output = exec('node ' + app);
        }
        catch (e) {
            error = e;
        }
        output.should.be.exactly('Starting application ...');
        should(error).be.exactly(null);
        setTimeout(() => done(), 1000);
    });

    it('should start at least 2 processes (1 master and at least 1 worker)', done => {
        let output = "";
        let error = null;
        try {
            output = exec('node ' + list);
            output = $.toArray(JSON.parse(output));
        }
        catch (e) {
            error = e;
        }
        output.should.be.an.instanceOf(Array);
        should(output.length >= 2).be.exactly(true);
        output[0].isMaster.should.be.exactly(true);
        should(error).be.exactly(null);
        done();
    });

    it('should start a http server on 3000', done => {
        got('127.0.0.1:3000').then(response => {
            response.body.toString().trim().match(/^\d+ is at your service$/).should.be.OK;
            done();
        })
        .catch(error => {
            error.should.not.be.OK;
            done();
        });
    });

});


describe('Lark-PM stop ', function () {
    this.timeout(10000);

    it('should stop the app with no errors', done => {
        let output = "";
        let error = null;
        try {
            output = exec('node ' + app + ' --lark-stop');
        }
        catch (e) {
            error = e;
        }
        output.should.be.exactly('Stopping application ...');
        should(error).be.exactly(null);
        done();
    });
  
    it('should remove all processes', done => {
        let output = "";
        let error = null;
        try {
            output = exec('node ' + list);
            output = $.toArray(JSON.parse(output));
        }
        catch (e) {
            error = e;
        }
        output.should.be.an.instanceOf(Array).with.lengthOf(0);
        should(error).be.exactly(null);
        done();
    });

});
