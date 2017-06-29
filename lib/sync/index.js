'use strict';

const Promise = require('bluebird');
const VError = require('verror');
const sync = Promise.promisifyAll(require('fh-mbaas-api').sync);
const join = require('path').join;
const log = require('fh-bunyan').getLogger(__filename);
const env = require('env-var');
const fs = require('fs');
const each = require('lodash').each;

const MONGO_URL = env('FH_MONGODB_CONN_URL').asString();
const REDIS_HOST = env('FH_REDIS_HOST').asString();
const REDIS_PORT = env('FH_REDIS_PORT').asPositiveInt();

// folders in this directory are sync collections, so get them as a list
const datasets = fs.readdirSync(join(__dirname))
  .filter((e) => fs.statSync(join(__dirname, e)).isDirectory());

exports.init = function () {
  log.info('initialise sync framework');

  function initDataset (dname) {
    log.info('initialising dataset "%s"', dname);

    const handlers = require(`./${dname}`);

    return sync.initAsync(dname, {
      'sync_frequency': 60
    })
      .then(() => {
        each(handlers, (fn, name) => {
          log.trace('binding handler %s for dataset %s', name, dname);
          sync[name](dname, fn);
        });
      })
      .catch((e) => {
        throw new VError(e, 'failed to initialise dataset %s', dname);
      });
  }

  return sync.connectAsync(MONGO_URL, {}, `redis://${REDIS_HOST}:${REDIS_PORT}`)
    .then(() => Promise.map(datasets, (dname) => initDataset(dname)));
};
