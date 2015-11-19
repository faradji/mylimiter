"use strict";

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
                next(err);
                return;
            }
            next();
        });
    };
};
