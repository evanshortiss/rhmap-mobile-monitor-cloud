'use strict';

const env = require('env-var');
const isLocal = env('FH_USE_LOCAL_DB').asBool();

if (isLocal) {
  // This only runs locally to load environment variables from a config file
  require('dotenv').config();
}

const Promise = require('bluebird');
const sync = require('lib/sync');
const fhc = require('lib/fhc');
const cron = require('lib/cron');
const log = require('fh-bunyan').getLogger(__filename);

// Perform startup tasks prior to actually bind the application to a port
// 1. Login to FHC and ensure we can get platform information
// 2. Start the sync framework and datasets
// 3. Setup cron jobs that will periodically refresh data
log.info('startup in progress. please be patient while tasks complete');
Promise.delay(1000)
  .then(fhc.init)
  .then(sync.init)
  .then(cron.init)
  .then(start)
  .catch((e) => {
    log.error(e, 'application startup failed');
    process.exit(1);
  });

function start () {
  const express = require('express');
  const app = module.exports = express();
  const auth = require('lib/auth');
  const mbaasApi = require('fh-mbaas-api');
  const mbaasExpress = mbaasApi.mbaasExpress();
  const port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
  const host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

  log.info('starting application');

  const whitelist = ['http://localhost:8080', 'http://127.0.0.1:8080'];
  const cors = require('cors')({
    origin: (origin, callback) => {
      // only add cors headers for local development, could also add app hosts
      callback(null, whitelist.indexOf(origin) !== -1);
    }
  });

  app.use(cors);
  app.options('/*', cors);

  // Define sys before our authentication since sys must be public
  app.use('/sys', mbaasExpress.sys([]));

  // Expose sync and other RHMAP APIs
  app.use('/mbaas', mbaasExpress.mbaas);

  // Note: important that this is added just before your own Routes
  app.use(mbaasExpress.fhmiddleware());

  // This will allow $fh.auth to work during local development
  app.use(auth.getFhAuthBoxStub());

  // All calls below this line will be authenticated via their X-FH-SESSIONTOKEN
  app.use(auth.getMiddleware());

  // Add the FeedHenry error handler ("uncaughtException" for restarting etc.)
  mbaasExpress.errorHandler();

  // 404 handler
  app.use(require('lib/express-not-found-handler'));

  // Add a express error handler of our own (this won't cause restart)
  app.use(require('lib/express-error-handler'));

  app.listen(port, host, function onListening () {
    log.info('App started at: ' + new Date() + ' on port: ' + port);
  });
}
