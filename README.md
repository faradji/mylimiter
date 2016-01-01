# mylimiter

## Installation

    npm install --save mylimiter
    mysql -u root -p exampledb < node_modules/mylimiter/mylimiter.sql

## API

The bucket analogy is used heavily. A bucket holds drips. Drips represent
requests. New drips are added each time the middleware function is called
and expired drips are purged. When a bucket is full (i.e. the number of
drips equals the bucket size), no new drips are added and an error is
returned via `next(err)`. The error will have the appropriate `status`: `429`
when the bucket is full (i.e. too many requests) and `500` when something
went wrong (e.g. couldn't connect to MySQL). Buckets are dynamic and
are automatically created and destroyed as needed. Bucket names, sizes, and
drip expiration are dynamic and can change on the fly. For example, there
could be a bucket per user and during periods of low activity, the size could
be larger and the drips could expiry more quickly.

### myLimiter(poolOrConfig, bucketOrFunction, bucketSizeOrFunction, periodInSecondsOrFunction)

Parameters:

* `poolOrConfig` - existing MySQL connection pool or a configuration object that can be passed to [node-mysql](https://github.com/felixge/node-mysql) to create a connection pool.
* `bucketOrFunction` - String containing the name of the bucket (up to 64 characters) or a function which accepts `(req, res)` and returns a String containing the name of the bucket.
* `bucketSizeOrFunction` - integer number of drips that can fit in each bucket or a function which accepts `(req, res)` and returns an integer number of drips.
* `periodInSecondsOrFunction` - integer number of seconds corresponding to the drip time-to-live or a function which accepts `(req, res)` and returns an integer number of seconds.

Returns:

* express middleware function:
  * middleware function accepts `(req, res, next)`. it also accepts `(callback)`.
  * calls the `drip()` procedure in the database.
  * calls `next()` upon success, and `next(err)` upon failure.

## Example

```
"use strict";

var mylimiter = require('mylimiter');
var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res.redirect('/api');
});

app.use('/api', mylimiter({ // MySQL Config
                        "user": "mylimiter",
                        "password": "mylimiter",
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
```

## Tips

For added security, create a separate user that only can call the `drip()` procedure:

```
GRANT EXECUTE ON PROCEDURE example.drip TO 'mylimiter'@'localhost' IDENTIFIED BY 'mylimiter';
FLUSH PRIVILEGES;
```

## License

See [LICENSE.md](https://github.com/tcort/mylimiter/blob/master/LICENSE.md)
