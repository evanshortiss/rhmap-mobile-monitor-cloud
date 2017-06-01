'use strict';

const Promise = require('bluebird');
const VError = require('verror');
const moment = require('moment');
const dao = require('lib/dao/status');
const push = Promise.promisify(require('fh-mbaas-api').push);

/**
 * Determines if a status should be sent via push
 * @param  {Object}   s A status from the RHMAP XML status field
 * @return {Boolean}
 */
function shouldSendStatus (s) {
  const now = moment().utc();
  const then = moment.utc(s.pubDate);

  return Math.abs(now.diff(then, 'hours')) < 2 && !s.notified;
}

/**
 * Send a push notification for any statuses issues provided in the Array
 * @param  {Array<Object>} statuses
 * @return {Promise}
 */
exports.sendStatusUpates = (statuses) => {
  return Promise.map(statuses, (s) => {
    if (shouldSendStatus(s)) {
      const alert = {
        alert: s.title
      };

      const opts = {
        broadcast: true
      };

      return push(alert, opts)
        .then(() => dao.markStatusAsSent(s))
        .catch((e) => {
          throw new VError(e, 'error sending push for status %s', s.title);
        });
    } else {
      return Promise.resolve();
    }
  });
};
