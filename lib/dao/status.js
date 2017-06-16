'use strict';

const mongo = require('rhmap-mongodb');
const moment = require('moment');
const Promise = require('bluebird');
const R = require('ramda');
const collection = mongo.collection('rhmap-status');

exports.remove = (query) => {
  return collection
    .then((col) => col.remove(query || {}));
};


/**
 * Marks a status as being sent.
 * @param  {Object} status
 * @return {Object}
 */
exports.markStatusAsSent = (status) => {
  return collection
    .then((col) => {
      return col.findAndModify(
        {'guid._Data': status.guid._Data},
        {},
        {
          $set: {
            notified: true
          }
        }
      );
    });
};


/**
 * Returns any status updates for the past month
 * @return {Promise<Array>}
 */
exports.getRecentStatuses = () => {
  const query = {
    pubDate: {
      $gte: moment.utc().subtract(3, 'months').toDate()
    }
  };

  const projection = {
    category: 1,
    description: 1,
    link: 1,
    pubDate: 1,
    title: 1
  };

  return collection
    .then((col) => col.find(query, projection).sort({pubDate: 1}).toArray());
};


/**
 * Upserts a list of statuses into the collection and returns the inserted items
 * @param  {Array<Object>} statuses
 * @return {Object}
 */
exports.upsertAndReturnNewStatuses = (statuses) => {

  function doInsert (status) {
    // safely parse to a UTC date object
    status.pubDate = moment.utc(
      status.pubDate,
      'ddd, DD MMM YYYY hh:mm:ss' // TODO: missing timezone offset here
    ).toDate();

    // format the data in a slightly nicer manner for our purposes
    status.description = status['content:encoded'];
    delete status['content:encoded'];

    return collection
      .then((col) => {
        return col.findAndModify(
          {'guid._Data': status.guid._Data},
          {},
          {$setOnInsert: status},
          {new: true, upsert: true}
        );
      });
  }

  return Promise.map(
    statuses.channel.item,
    doInsert,
    {concurrency: 10}
  )
    .then(R.filter((item) => !item.lastErrorObject.updatedExisting))
    .then(R.pluck('value'));
};
