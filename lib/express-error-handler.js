'use strict';

var log = require('fh-bunyan').getLogger(__filename);

/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "next" }]*/
module.exports = function expressErrorHandler (err, req, res, next) {
  // next must be provided for express to accept this as error handler
  // jshint unused:false

  log.error({
    err: err,
    url: req.originalUrl,
    body: req.body,
    query: req.query
  }, 'error processing request');


  res.status(500).json({
    msg: 'Internal Server Error'
  });
};
