'use strict';

const Promise = require('bluebird');
const VError = require('verror');
const sync = Promise.promisifyAll(require('fh-mbaas-api').sync);
const join = require('path').join;
const log = require('fh-bunyan').getLogger(__filename);
const fs = require('fs');

// folders in this directory are sync collections, so get them as a list
const datasets = fs.readdirSync(join(__dirname))
  .filter((e) => fs.statSync(join(__dirname, e)).isDirectory());

exports.init = function () {
  log.info('initialise sync framework');

  // Loop over each sync dataset and initialise it and it's handlers
  return Promise.map(datasets, (dname) => {
    log.info('initialising dataset "%s"', dname);

    const handlers = require(`./${dname}`);

    return sync.initAsync(dname, {})
      .then(() => {
        sync.handleList(dname, handlers.handleList);
      })
      .catch((e) => {
        throw new VError(e, 'failed to initialise dataset %s', dname);
      });
  });
};
