'use strict';

const Promise = require('bluebird');
const sync = require('lib/sync');
const fhc = require('lib/fhc');
const cron = require('lib/cron');

require('https').globalAgent.maxSockets = 1000;
require('http').globalAgent.maxSockets = 1000;

Promise.resolve()
  .then(fhc.init)
  .then(sync.init)
  .then(cron.init)
  .then(start);

function start () {
  const express = require('express');
  const log = require('fh-bunyan').getLogger(__filename);
  const app = module.exports = express();
  const auth = require('lib/auth');
  const mbaasApi = require('fh-mbaas-api');
  const mbaasExpress = mbaasApi.mbaasExpress();
  const port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
  const host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

  log.info('starting application');

  app.use(require('cors')());

  // Note: the order which we add middleware to Express here is important!
  app.use('/sys', mbaasExpress.sys([]));
  // All sync calls will be authenticated using the X-FH-SESSIONTOKEN included
  app.use('/mbaas/sync/*', auth.getMiddleware());
  app.use('/mbaas', mbaasExpress.mbaas);

  // This will allow $fh.auth to work during local development
  app.use(auth.getFhAuthBoxStub());

  // Note: important that this is added just before your own Routes
  app.use(mbaasExpress.fhmiddleware());

  // Add the FeedHenry error handler ("uncaughtException" for restarting)
  mbaasExpress.errorHandler();

  // 404 handler
  app.use(function notFoundHandler (req, res){
    res.status(404).json({
      message: '404 not found'
    });
  });

  // Add a express error handler of our own (this won't cause restart)
  app.use(require('lib/express-error-handler'));

  app.listen(port, host, function onListening () {
    log.info('App started at: ' + new Date() + ' on port: ' + port);
  });
}
