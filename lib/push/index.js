'use strict';

const Promise = require('bluebird');
const VError = require('verror');
const moment = require('moment');
const status = require('lib/dao/status');
const userprefs = require('lib/dao/userprefs');
const log = require('fh-bunyan').getLogger(__filename);
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
 * Sends a push notification for any users that require one for the current
 * resource usage in relation to their defined thresholds
 * {
 *   acme-dev: {
 *     resources: {
 *       // this is a percentage
 *       cpu: { used: 50 },
 *
 *       // this is megabytes
 *       memory: { used: 523 },
 *
 *       // this is also megabytes
 *       disk: { used: 341 }
 *     }
 *   }
 * }
 */
exports.sendResourceUsagePush = (usageinfo) => {
  function sendPushForResourceUsageForEnvironment (users, env) {
    if (users.length === 0) {
      log.info(`no user resource thresholds were exceeded for ${env}`);
      return Promise.resolve();
    }

    const msg = `Resource usage in your ${env} environment is exceeding desired threholds! You should investiagte why!`;
    const userList = users.map((u) => u.username);

    log.info('sending resource usage push for environment %s to users %j', env, userList);

    return push(msg, {
      // we only have a single client application so we can set broadcast true
      // but if we had many client applications we would specify them here
      broadcast: true,
      criteria: {
        alias: userList
      }
    });
  }

  return userprefs.getUsersForExceededThresholds(usageinfo)
    .tap((environments) => log.trace('thresholds queries retured %j', environments))
    .then((environments) => {
      return Promise.each(
        Object.keys(environments),
        (env) => sendPushForResourceUsageForEnvironment(environments[env], env)
      );
    });
};


/**
 * Send a push notification for any statuses issues provided in the Array
 * @param  {Array<Object>} statuses
 * @return {Promise}
 */
exports.sendStatusUpatesPush = (statuses) => {
  return Promise.map(statuses, (s) => {
    if (shouldSendStatus(s)) {
      const alert = {
        alert: s.title
      };

      const opts = {
        broadcast: true
      };

      return push(alert, opts)
        .then(() => status.markStatusAsSent(s))
        .catch((e) => {
          throw new VError(e, 'error sending push for status %s', s.title);
        });
    } else {
      return Promise.resolve();
    }
  });
};
