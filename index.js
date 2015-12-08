"use strict";

var log = require('ssi-logger');
var mysql = require('mysql');

module.exports = function myLimiter(poolOrConfig, bucketOrFunction, bucketSizeOrFunction, periodInSecondsOrFunction) {

    var pool = poolOrConfig.hasOwnProperty('config') ? poolOrConfig : mysql.createPool(poolOrConfig);

    return function myLimiterMiddleware(req, res, next) {

        var bucket = (typeof bucketOrFunction === "function") ? bucketOrFunction(req, res) : bucketOrFunction;
        var bucketSize = (typeof bucketSizeOrFunction === "function") ? bucketSizeOrFunction(req, res) : bucketSizeOrFunction;
        var periodInSeconds = (typeof periodInSecondsOrFunction === "function") ? periodInSecondsOrFunction(req, res) : periodInSecondsOrFunction;

        if (arguments.length === 1) {
            next = arguments[0];
        }

        pool.query('CALL drip(?, ?, ?)', [ bucket, bucketSize, periodInSeconds ] , function (err, result) {
            if (err) {
                err.status = (err.sqlState === '45429') ? 429 : 500;
                if (err.status === 429) {
                    log('WARN', 'mylimiter limit exceeded bucket=%s', bucket);
                } else {
                    log('ERR', 'mylimiter db error bucket=%s', bucket, err);
                }
                next(err);
                return;
            }
            log('DEBUG', 'mylimiter ok bucket=%s', bucket);
            next();
        });
    };
};
