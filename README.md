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
  * middleware function accepts `(req, res, next)`.
  * calls the `drip()` procedure in the database.
  * calls `next()` upon success, and `next(err)` upon failure.

## Example

```
"use strict";

var mylimiter = require('./index');
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
```

## License

```
Copyright (c) 2015 Thomas Cort <linuxgeek@gmail.com>

Permission to use, copy, modify, and distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```
