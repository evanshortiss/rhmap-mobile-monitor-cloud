'use strict';

const Promise = require('bluebird');
const cmaster = Promise.promisifyAll(require('cron-master'));
const join = require('path').join;
const log = require('fh-bunyan').getLogger(__filename);
const getEventHandlers = require('./cron-event-handlers');
const VError = require('verror');

/**
 * Initialises our cron jobs and binds event handlers to them.
 * @return {Promise}
 */
exports.init = function () {
  log.info('configuring and starting cron jobs');

  return cmaster.loadJobsAsync(join(__dirname, '/jobs'))
    .then((jobs) => Promise.each(jobs, initialiseJob));
};


/**
 * Intialises the passed job and waits for it to complete the initial tick
 * before resolving. This ensures we have data available for all clients prior
 * to binding to a port and serving requests
 * @param   {CronMasterJob} job
 * @return  {Promise}
 */
function initialiseJob (job) {
  return new Promise((resolve, reject) => {
    log.info(`intialise job ${job.meta.name}`);

    const handlers = getEventHandlers(job);

    // Get notified when cron jobs finish, take too long, etc.
    job.on(cmaster.EVENTS.TICK_STARTED, handlers.onTickStarted);
    job.on(cmaster.EVENTS.TICK_COMPLETE, handlers.onTickComplete);
    job.on(cmaster.EVENTS.TIME_WARNING, handlers.onTimeWarning);
    job.on(cmaster.EVENTS.OVERLAPPING_CALL, handlers.onOverlappingCall);

    // Add a one time listener to each job that will decrement our counter
    // and eventually allow app startup to complete
    job.on(cmaster.EVENTS.TICK_COMPLETE, (err) => {
      if (!err) {
        log.info(`job ${job.meta.name} completed it's initial tick`);
        resolve();
      } else {
        log.error(`cron ${job.meta.name} initial tick encountered an error`);
        reject(new VError(err, 'cron failed initial tick'));
      }
    });

    // Start the job ticking and also run it to ensure we have some
    // data ready for users ASAP
    job.start();
    job.run();
  });
}
