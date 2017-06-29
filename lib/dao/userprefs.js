'use strict';

const mongo = require('rhmap-mongodb');
const collection = mongo.collection('userprefs');
const log = require('fh-bunyan').getLogger(__filename);
const Promise = require('bluebird');
const R = require('ramda');

/**
 * Build the default user preferences object for use by the frontend application
 * @return {Object}
 */
function getDefaults () {
  const prefs = {
    userprefs: {
      notificationConfigs: {
        global: {},
        apps: {}
      }
    }
  };

  return prefs;
}


/**
 * Returns preferences for a given user
 * @param {String} username
 */
exports.getForUser = function (username) {
  log.debug('getting preferences for %s from mongo', username);

  const query = {username: username};
  const projection = {_id: 0, userprefs: 1};

  return collection.then((col) => col.findOne(query, projection))
    .then((data) => {
      if (data) {
        // Sample
        // {"_id":"5940e656a6bd2efff66ad2ad","userprefs":{"notificationConfigs":{"demos-dev":{"5ps7eqemyuv6ceiuw6a4pdfl":{"cpu":20,"memory":256,"disk":200}},"demos-test":{},"demos-uat":{}}}}
        return data;
      } else {
        // Sample
        // {"userprefs":{"notificationConfigs":{"demos-dev":{},"demos-test":{},"demos-uat":{}}}}
        return getDefaults();
      }
    })
    .then((prefs) => {
      // should probably not return these from mongo in the first place
      delete prefs.userprefs.notificationConfigs._id;
      delete prefs.userprefs.notificationConfigs.ts;

      return prefs;
    });
};


/**
 * Updates preferences for a user and returns the new preferences entry
 * @param {String} username
 * @param {Object} preferences
 */
exports.updateForUser = function (username, prefs) {
  log.info('updating prefs for user %s with payload %s', username, prefs);

  const query = {
    username: username
  };

  const sort = {};

  const ops = {
    $set: {
      // don't allow a device to accidentally change the username
      userprefs: R.omit('username', prefs)
    },
    $setOnInsert: {
      username: username
    }
  };

  const options = {new: true, upsert: true};

  return collection
    .then((col) => col.findAndModify(query, sort, ops, options))
    .tap((ret) => log.trace('updateForUser mongo call returned %j', ret))
    .then((ret) => ret.value.userprefs);
};


/**
 * When we get resource information we need to determine if a push notification
 * should be sent to users who have defined thresholds for specific resources.
 * @param {Object} usageinfo
 *
 * Sample usageinfo input:
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
exports.getUsersForExceededThresholds = (usageinfo) => {
  log.info('getting users who need to be notified of current resource usage');
  log.trace(usageinfo);
  const queries = {};

  // Perform a query for each environment found
  Object.keys(usageinfo).forEach((env) => {
    log.info('build usage threshold query for env %s', env);

    const nestedKey = `userprefs.notificationConfigs.global.${env}`;
    const query = {
      $or: [
        {
          [`${nestedKey}.cpu`]: {
            $ne: 0, // 0 means no notification is wanted so we ignore those
            $lte: usageinfo[env].resources.cpu.used
          }
        },
        {
          [`${nestedKey}.memory`]: {
            $ne: 0,
            $lte:
              usageinfo[env].resources.memory.apps +
              usageinfo[env].resources.memory.cache +
              usageinfo[env].resources.memory.system
          }
        },
        {
          [`${nestedKey}.disk`]: {
            $ne: 0,
            $lte: usageinfo[env].resources.disk.used
          }
        }
      ]
    };

    log.trace('exec query for thresholds - %j', query);
    queries[env] = collection.then((col) => col.find(query).toArray());
  });


  return Promise.props(queries);
};
