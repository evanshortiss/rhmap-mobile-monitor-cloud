'use strict';

const Promise = require('bluebird');
const fhc = require('lib/fhc');
const resources = require('lib/dao/resources');

/**
 * Executed by our cron to get resource usage for the domain on a regular basis
 * @param  {Object}   job
 * @param  {Function} done
 * @return {Promise}
 */
module.exports = function getResourcesCronHandler (job, done) {
  return Promise.resolve()
    .then(fhc.getResources)
    .then(resources.insertResources)
    .then(resources.removeOldResources)
    .asCallback(done);
};
