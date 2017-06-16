'use strict';

/**
 * Returns an object containing event handler functions
 * @param   {CronMasterJob} job
 * @return  {Object}
 */
module.exports = function (job) {
  const log = require('fh-bunyan').getLogger(`cron@${job.meta.name}`);

  return {
    onTickStarted: () => {
      log.info('cron tick started');
    },

    onTickComplete: (err, res, time) => {
      if (err) {
        log.error(err, `error returned from running job after ${time}ms`);
      } else {
        log.info(`tick complete in ${time}ms!`);
      }
    },

    onTimeWarning: () => {
      log.warn('job is exceeding expected run time');
    },

    onOverlappingCall: () => {
      log.warn('attempted to run before a previous tick completed');
    }
  };
};
