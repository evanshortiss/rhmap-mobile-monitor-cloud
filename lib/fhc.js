'use strict';

const Promise = require('bluebird');
const env = require('env-var');
const log = require('fh-bunyan').getLogger(__filename);
const R = require('ramda');
const fhc = Promise.promisifyAll(require('fh-fhc'));
const join = require('path').join;
const mkdirp = Promise.promisify(require('mkdirp'));

const DOMAIN = env('FHC_TARGET').asString() || env('FH_MILLICORE').required().asString();
const USER = env('FHC_USER').required().asString();
const PASS = env('FHC_PASS').required().asString();



function executeCommand (cmd) {
  const cmdStr = cmd.join(' ');

  log.trace('exec fhc command:', cmdStr);

  return fhc.applyCommandFunctionAsync(cmd)
    .tap(() => log.trace('successful exec of command:', cmdStr));
}

exports.init = function () {
  return Promise.resolve()
    .then(() => {
      log.info(`initialising fhc for user ${USER}`);

      return fhc.loadAsync()
        .then(() => mkdirp(join(process.cwd(), 'config', USER)))
        .then(() => executeCommand(['fhcfg', 'set', 'userconfig', join(process.cwd(), 'config', USER, '.fhcrc')]))
        .then(() => executeCommand(['fhcfg', 'set', 'usertargets', join(process.cwd(), 'config', USER, '.fhctargets')]))
        .then(() => executeCommand(['target', DOMAIN]))
        .then(() => executeCommand(['login', USER, PASS]));
    });
};

exports.getEvironments = function () {
  return executeCommand(['admin', 'environments', 'list']);
};

exports.getResources = function () {
  return exports.getEvironments()
    .then(R.pluck('id'))
    .then((envs) => {
      // We cannot use map/props since these are run concurrently and
      // fhc cannot handle concurrrent requests. For some reason the last
      // request issued in a concurrrent batch is used as a response to all
      // ongoing requests. This might be linked to promisify and not fhc?
      return Promise.mapSeries(envs, (e) => {
        return executeCommand(['resources', 'list', `--env=${e}`]);
      })
        .then((res) => {
          let ret = {};

          envs.forEach((e, idx) => {
            ret[e] = res[idx];
          });

          ret.ts = Date.now();

          return ret;
        });
    });
};
