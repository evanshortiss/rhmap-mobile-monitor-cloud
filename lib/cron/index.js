'use strict';

const Promise = require('bluebird');
const cmaster = Promise.promisifyAll(require('cron-master'));
const join = require('path').join;
const log = require('fh-bunyan').getLogger(__filename);

exports.init = function () {
  return cmaster.loadJobsAsync(join(__dirname, '/jobs'))
    .then((jobs) => {
      jobs.forEach(function (job) {
        // Using event map for name.
        // Log output when the job is about to run.
        job.on(cmaster.EVENTS.TICK_STARTED, function () {
          log.info('Job tick starting!');
        });


        // Using String for event name.
        // Log output when the job has complete.
        job.on('tick-complete', function (err, res, time) {
          if (err) {
            log.error(
              'Error returned from running job %s after %sms: %s',
              job.meta.name,
              time,
              err
            );
          } else {
            log.info('Job tick complete in %dms!', time);
          }
        });

        job.on(cmaster.EVENTS.TIME_WARNING, function () {
          log.info('Job has %s exceeded expected run time!', job.meta.name);
        });

        job.on('overlapping-call', function () {
          log.info(
            'Job %s attempting to run before previous tick is complete!',
            job.meta.name
          );
        });

        job.start();
        job.run();
      });
    });
};
