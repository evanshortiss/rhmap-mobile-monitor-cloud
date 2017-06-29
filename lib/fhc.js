'use strict';

const Promise = require('bluebird');
const env = require('env-var');
const log = require('fh-bunyan').getLogger(__filename);
const R = require('ramda');
const fhc = Promise.promisifyAll(require('fh-fhc'));

const DOMAIN = env('FHC_TARGET').asString() || env('FH_MILLICORE').required().asString();
const USER = env('FHC_USER').required().asString();
const PASS = env('FHC_PASS').required().asString();


/**
 * Executes all FHC commands using a Promise wrapper and adds logging
 * @param  {Array<String>} cmd  command args, e.g ['projects', 'list']
 * @return {Promise}
 */
function executeCommand (cmd) {
  const cmdStr = cmd.join(' ');

  log.trace('exec fhc command:', cmdStr);

  return fhc.applyCommandFunctionAsync(cmd)
    .tap((ret) => {
      log.trace('successful exec of command "%s"', cmdStr);
      log.trace('results from command', ret);
    });
}


/**
 * Initialises the fhc module by performing the following then resolving:
 *
 * 1. config
 * 2. target
 * 3. login
 *
 * @return {Promise}
 */
exports.init = function () {
  return Promise.resolve()
    .then(() => {
      log.info(`initialising fhc for user ${USER}`);

      return fhc.loadAsync()
        .then(() => executeCommand(['target', DOMAIN]))
        .then(() => executeCommand(['login', USER, PASS]));
    });
};


/**
 * Returns a list of environments on the targetted domain
 * @return {Promise} [description]
 */
exports.getEvironments = function () {
  return executeCommand(['admin', 'environments', 'list']);
};


/**
 * Gets resource usage for all environments of the targetted domain.
 * Returns an Object with keys and values for each environment e.g dev and test
 * @return {Promise<Object>}
 */
exports.getResources = function () {
  return exports.getEvironments()
    .then(R.pluck('id'))
    .then((envs) => {
      // We cannot use map/props since these are run concurrently and it seems
      // fhc doesn't handle concurrrent requests. For some reason the last
      // request issued in a concurrrent batch is used as a response to ALL
      // the requests issued? This might be linked to promisify and not fhc?
      return Promise.mapSeries(envs, (e) => {
        return executeCommand(['resources', 'list', `--env=${e}`]);
      })
        .then((res) => {
          let ret = {};

          envs.forEach((e, idx) => {
            ret[e] = res[idx];
          });

          return ret;
        });
    });
};
