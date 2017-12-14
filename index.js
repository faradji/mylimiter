"use strict";

const log = require( 'ssi-logger' );
const mysql = require( 'mysql' );
let connection;
module.exports = function myLimiter( poolOrConfig, bucketOrFunction, bucketSizeOrFunction, periodInSecondsOrFunction ) {

	const pool = poolOrConfig.hasOwnProperty( 'config' ) ? poolOrConfig : mysql.createPool( poolOrConfig );

	return async function myLimiterMiddleware( req, res, next ) {

		const bucket = ( typeof bucketOrFunction === "function" ) ? bucketOrFunction( req, res ) : bucketOrFunction;
		const bucketSize = ( typeof bucketSizeOrFunction === "function" ) ? bucketSizeOrFunction( req, res ) : bucketSizeOrFunction;
		const periodInSeconds = ( typeof periodInSecondsOrFunction === "function" ) ? periodInSecondsOrFunction( req, res ) : periodInSecondsOrFunction;

		if ( arguments.length === 1 ) {
			next = arguments[ 0 ];
		}

		pool.getConnection( async function ( getConnectionErr, connectionFromPool ) {
			if ( getConnectionErr ) {
				log( 'DEBUG', 'mylimiter', getConnectionErrr );
			}
			try {
				connection = await connectionFromPool;
			} catch ( e ) {
				log( 'DEBUG', 'mylimiter', e );
			}

			connection.beginTransaction( function ( transactionErr ) {
				if ( transactionErr ) {
					connection.rollback( function () {
						connection.release();
						log( 'DEBUG', 'mylimiter', transactionErr );
					} );
				}

				connection.query( 'CALL drip(?, ?, ?)', [ bucket, bucketSize, periodInSeconds ], function ( queryErr, result ) {
					connection.release();
					if ( queryErr ) {
						queryErr.status = ( queryErr.sqlState === '45429' ) ? 429 : 500;
						if ( queryErr.status === 429 ) {
							connection.rollback( function () {
								connection.release();
								log( 'DEBUG', 'mylimiter', commitErr );
							} );
							log( 'WARN', 'mylimiter limit exceeded bucket=%s', bucket );
						} else {
							connection.rollback( function () {
								connection.release();
								log( 'DEBUG', 'mylimiter', commitErr );
							} );
							connection.rollback( function () {
								connection.release();
								log( 'DEBUG', 'mylimiter', commitErr );
							} );
							log( 'ERR', 'mylimiter db error bucket=%s', bucket, queryErr );
						}
						next( queryErr );
						return;
					}
					connection.commit( function ( commitErr ) {
						if ( commitErr ) {
							connection.rollback( function () {
								connection.release();
								log( 'DEBUG', 'mylimiter', commitErr );
							} );
						}
						log( 'DEBUG', 'mylimiter ok bucket=%s', bucket );
						next();

					} );

				} );
			} );
		} );
	};
};
