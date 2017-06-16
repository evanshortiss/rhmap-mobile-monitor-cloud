'use strict';

const log = require('fh-bunyan').getLogger(__filename);
const userprefs = require('lib/dao/userprefs');

exports.handleList = function (dataset, query, cb, meta) {
  const username = query.username || meta && meta.username;

  log.debug('listing userprefs for %s', username);

  return userprefs.getForUser(username)
    .tap((data) => log.debug('listed userprefs for %s are %j', username, data))
    .asCallback(cb);
};

exports.handleUpdate = function (datasetId, uid, data, cb, meta) {
  log.trace('arguments for update', arguments);
  log.info(`update userprefs for ${meta.username} with payload %j`, data);

  return userprefs.updateForUser(meta.username, data).asCallback(cb);
};

exports.handleRead = function (datasetId, uid, cb, meta) {
  log.debug('reading userprefs for %s with uid %s', meta.username, uid);

  return userprefs.getForUser(meta.username)
    .then((data) => {
      // we want to get just the "userprefs" entry
      return data.userprefs;
    })
    .asCallback(cb);
};
