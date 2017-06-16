'use strict';

const mongo = require('rhmap-mongodb');
const collection = mongo.collection('userprefs');
const log = require('fh-bunyan').getLogger(__filename);
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
