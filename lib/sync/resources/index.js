'use strict';

const Promise = require('bluebird');
const log = require('fh-bunyan').getLogger(__filename);
const resources = require('lib/dao/resources');

exports.handleList = function (dataset, query, meta, cb) {
  log.debug('performing a list call for resources');

  return Promise.resolve()
    .then(resources.getLatestResources)
    .then((data) => {
      // Don't need/want this in the sync response
      delete data._id;
      delete data.ts;

      log.debug('returning the following resource data', data);

      return data;
    })
    .asCallback(cb);
};
