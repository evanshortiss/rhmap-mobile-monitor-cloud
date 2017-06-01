'use strict';

const parser = require('pixl-xml');
const VError = require('verror');
const dao = require('lib/dao/status');
const Promise =  require('bluebird');
const log =  require('fh-bunyan').getLogger(__filename);
const request = Promise.promisify(require('request'));

module.exports = function getPlatformStatusCronHandler (job, done) {
  log.info('getting latest news and alerts');

  return Promise.resolve()
    .then(() => getStatusXml())
    .then((xml) => parser.parse(xml))
    .then((json) => dao.upsertAndReturnNewStatuses(json))
    // .then((inserts) => push.sendStatusUpates(inserts)) TODO
    .asCallback(done);
};

function getStatusXml () {
  return request({
    url: 'https://redhatmobilestatus.com/feed/',
    method: 'GET'
  })
    .then((res) => {
      if (res.statusCode === 200) {
        return res.body;
      } else {
        throw new VError(
          'received http %s status when requesting xml feed - %j',
          res.statusCode,
          res.body
        );
      }
    })
    .catch((err) => {
      throw new VError(err, 'error requesting status xml feed');
    });
}
