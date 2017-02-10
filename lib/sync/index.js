'use strict';

const Promise = require('bluebird');
const sync = require('fh-mbaas-api').sync;
const join = require('path').join;
const fs = require('fs');

// folders in this directory are sync collections, so get them as a list
const datasets = fs.readdirSync(join(__dirname)).filter((e) => {
  return fs.statSync(join(__dirname, e)).isDirectory();
});

exports.init = function () {
  // Loop over each sync dataset and initialise it and it's handlers
  return Promise.map(datasets, (dname) => {
    return new Promise((resolve, reject) => {
      sync.init(dname, {}, (err) => {
        if (err) {
          reject(err);
        } else {
          const handlers = require(join(__dirname, dname));
          sync.handleList(dname, handlers.handleList);

          resolve();
        }
      });
    });
  });
};
