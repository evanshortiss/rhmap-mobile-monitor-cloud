'use strict';

const mongo = require('rhmap-mongodb');
const moment = require('moment');
const collection = mongo.collection('fhc-resources');

exports.getLatestResources = function () {
  const query = {
    ts: {
      // limit query scope to the past hour
      $gte: moment().subtract(1, 'hour').valueOf()
    }
  };
  const opts = {limit : 1};
  const sort = {$natural: -1};

  return collection
    .then((col) => col.find(query, {}, opts).sort(sort).toArray())
    .then((data) => {
      return data[0];
    });
};

exports.insertResources = function (data) {
  return collection.then((col) => col.insert(data));
};
