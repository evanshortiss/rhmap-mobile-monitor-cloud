'use strict';

const mongo = require('rhmap-mongodb');
const moment = require('moment');
const collection = mongo.collection('fhc-resources');

/**
 * Returns the most recently inserted entry from our collection
 * @return {Promise}
 */
exports.getLatestResources = function () {
  return collection
    .then((col) => col.find({}).sort({ts: -1}).limit(1).toArray())
    .then((data) => data[0]);
};


/**
 * Inserts a resource Object
 * @param  {Object} data
 * @return {Promise}
 */
exports.insertResources = function (data) {
  return collection.then((col) => col.insert(data));
};


/**
 * Since we fetch resource data frequently we'll end up with thousands of
 * records very quickly. We can easily keep 2 months of records without much
 * concern though since it shouldn't be more than a few hundred megabytes
 *
 * @return {Promise}
 */
exports.removeOldResources = function () {
  // Removes resources that are over two months old
  const query = {
    ts: {
      $lte: moment().subtract(2, 'months').valueOf()
    }
  };

  return collection.then((col) => col.remove(query));
};
