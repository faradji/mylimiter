"use strict";

var request = require('supertest');
var express = require('express');
var fs = require('fs');
var path = require('path');
var mysql = require('mysql');
var nconf = require('nconf');
var log = require('ssi-logger');
var DbTestUtil = require('dbtestutil');
var mylimiter = require('../');

// uncomment to display debug output
// process.on('log', log.consoleTransport());

// load the database configuration.
var options = nconf.argv().env().file({ file: path.join(__dirname, 'db.conf') }).get();

var dbTestUtil = new DbTestUtil(options);

before(function (done) {
    this.timeout(30 * 1000); // 30 seconds (max)
    dbTestUtil.startLocalMySql(path.join(__dirname, 'mylimiter_load.sql'), done);
});

describe('mylimiter', function () {
    this.timeout(10 * 1000); // 10 seconds (max) per test

    var app;

    function doRequest(n, done) {
        if (n === 0) {
            done();
            return;
        }

        request(app)
            .get('/')
            .expect('Content-Type', /json/)
            .expect({ message: 'Hello, World!' })
            .expect(200)
            .end(function () {
                doRequest(n - 1, done);
            });
    }

    before(function () {
        app = express();
        app.use(mylimiter({ "database": "example", socketPath: options.mysql_socket || '/tmp/mysqltest.sock' }, 'test', 3, 5));
        app.get('/', function (req, res) {
            res.json({ message: 'Hello, World!' });
        });
        app.use(function (err, req, res, next) {
            console.log(err, err.toString());
            res.sendStatus(err.status || 500);
        });
    });

    it('should limit requests', function (done) {
        doRequest(3, function () {
            request(app)
                .get('/')
                .expect(429, done);
        });
    });
});

after(function (done) {
    this.timeout(30 * 1000); // 30 seconds (max)
    dbTestUtil.killLocalMySql(done);
});
