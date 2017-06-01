'use strict';

const Promise = require('bluebird');
const log = require('fh-bunyan').getLogger(__filename);
const status = require('lib/dao/status');

exports.handleList = function (dataset, query, callback) {
  log.debug('performing list call for newsfeed');

  return Promise.resolve()
    .then(() => status.getRecentStatuses())
    .then((data) => {
      return data.reduce((memo, current) => {
        memo[current._id] = current;

        return memo;
      }, {});
    })
    .tap((ret) => log.debug('returning the following news items', ret))
    .asCallback(callback);
};
