'use strict';

const env = require('env-var');
const log = require('fh-bunyan').getLogger(__filename);
const express = require('express');
const mbaasExpress = require('fh-mbaas-api').mbaasExpress();

// Simple check to determine if we're running locally
const isLocal = env('FH_USE_LOCAL_DB').asBool();


exports.getMiddleware = function () {
  if (isLocal) {
    return function localFhAuthOverride (req, res, next) {
      log.info('running locally, bypassing fhauth session check');

      // Pretend there's some work going on...
      setTimeout(next, 500);
    };
  } else {
    // Only check the token validity every 15 mins
    return mbaasExpress.fhauth({cache: true, expire: 60 * 15});
  }
};

exports.getFhAuthBoxStub = function () {
  var router = express.Router();

  if (isLocal) {
    log.info(
      'running locally, registering "/box/srv/1.1/admin/authpolicy/auth"'
    );

    router.post('/box/srv/1.1/admin/authpolicy/auth', function (req, res) {
      // Simulate a real login delay-ish
      setTimeout(() => {
        res.json({
          status: 'ok',
          sessionToken: 'localauthtoken',
          authResponse: 'looks like you logged in locally'
        });
      }, 1000);
    });
  }

  return router;
};
