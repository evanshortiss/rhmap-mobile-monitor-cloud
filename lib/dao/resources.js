'use strict';

const mongo = require('rhmap-mongodb');
const collection = mongo.collection('fhc-resources');

exports.getLatestResources = function () {
  return collection
    .then((col) => col.find({}).sort({$natural: -1}).toArray())
    .then((data) => {
      return data[0];
    });
};

exports.insertResources = function (data) {
  return collection.then((col) => col.insert(data));
};
