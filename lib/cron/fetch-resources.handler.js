'use strict';

const fhc = require('lib/fhc');
const resources = require('lib/dao/resources');
const push = require('lib/push');
const log = require('fh-bunyan').getLogger(__filename);
const omit = require('ramda').omit;

/**
 * Executed by our cron to get resource usage for the domain on a regular basis
 * @param  {Object}   job
 * @param  {Function} done
 * @return {Promise}
 */
module.exports = function getResourcesCronHandler (job, done) {
  return fhc.getResources()
    .then((usageinfo) => {
      log.info('got resource usage. inserting into mongo');

      return resources.insertResources(usageinfo)
        .then(() => push.sendResourceUsagePush(omit('_id', usageinfo)));
    })
    .then(resources.removeOldResources)
    .asCallback(done);
};
