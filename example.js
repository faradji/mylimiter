"use strict";

var mylimiter = require('./');
var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res.redirect('/api');
});

app.use('/api', mylimiter({ // MySQL Config
                        "user": "root",
                        "password": "abc123",
                        "database": "example",
                        "host": "localhost"
                    },
                    function (req, res) { return req.ip; }, // dynamic bucket name
                    5, // bucket can hold 5 drips per time period
                    60 // time period is 60 seconds
                ), function (req, res) {

    res.json({ hello: 'world' });
});

app.listen(3000);
