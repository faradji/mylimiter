"use strict";

var log = require('ssi-logger');
var mysql = require('mysql');

module.exports = function myLimiter(poolOrConfig, bucketOrFunction, bucketSizeOrFunction, periodInSecondsOrFunction) {

    var pool = poolOrConfig.hasOwnProperty('config') ? poolOrConfig : mysql.createPool(poolOrConfig);

    return function myLimiterMiddleware(req, res, next) {

        var bucket = (typeof bucketOrFunction === "function") ? bucketOrFunction(req, res) : bucketOrFunction;
        var bucketSize = (typeof bucketSizeOrFunction === "function") ? bucketSizeOrFunction(req, res) : bucketSizeOrFunction;
        var periodInSeconds = (typeof periodInSecondsOrFunction === "function") ? periodInSecondsOrFunction(req, res) : periodInSecondsOrFunction;

        pool.query('CALL drip(?, ?, ?)', [ bucket, bucketSize, periodInSeconds ] , function (err, result) {
            if (err) {
                err.status = (err.sqlState === '45429') ? 429 : 500;
                if (err.status === 429) {
                    log('WARN', 'mylimiter limit exceeded client_ip=%s bucket=%s', req.ip, bucket);
                } else {
                    log('ERR', 'mylimiter db error client_ip=%s bucket=%s', req.ip, bucket, err);
                }
                next(err);
                return;
            }
            log('DEBUG', 'mylimiter ok client_ip=%s bucket=%s', req.ip, bucket);
            next();
        });
    };
};
