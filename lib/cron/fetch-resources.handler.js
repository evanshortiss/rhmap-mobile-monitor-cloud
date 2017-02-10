'use strict';

const Promise = require('bluebird');
const fhc = require('lib/fhc');
const resources = require('lib/dao/resources');

module.exports = function (job, done) {
  return Promise.resolve()
    .then(fhc.getResources)
    .then(resources.insertResources)
    .asCallback(done);
};
