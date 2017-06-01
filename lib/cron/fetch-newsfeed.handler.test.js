'use strict';

const sinon = require('sinon');
const expect = require('expect');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const fs = require('fs');

// Allow mocking of bluebird promises
require('sinon-as-promised')(require('bluebird'));

describe(__filename, () => {
  const NEWSFEED = 'lib/dao/status';
  const REQUEST = 'request';
  const XML = fs.readFileSync('fixtures/redhat-mobile-status.xml', 'utf8');

  let stubs, mod;

  beforeEach(() => {
    stubs = {
      [NEWSFEED]: {
        upsertAndReturnNewStatuses: sinon.stub()
      },
      [REQUEST]: sinon.stub()
    };

    mod = proxyquire('./fetch-newsfeed.handler.js', stubs);
  });

  it('should fail due to a request error', () => {
    stubs[REQUEST].yields(new Error('ECONNREFUSED'));

    return mod()
      .then(() => {
        throw new Error('not meant to hit this error');
      })
      .catch((e) => {
        expect(e.toString()).toInclude('error requesting status xml feed: ECONNREFUSED');
        expect(stubs[REQUEST].calledWith({
          url: 'https://redhatmobilestatus.com/feed/',
          method: 'GET'
        })).toBe(true);
      });
  });

  it('should fail due to a 500 response code', () => {
    stubs[REQUEST].yields(null, {statusCode: 500, body: 'sorry about that'});

    return mod()
      .then(() => {
        throw new Error('not meant to hit this error');
      })
      .catch((e) => {
        expect(e.toString()).toInclude('error requesting status xml feed');
        expect(e.toString()).toInclude('received http 500 status when requesting xml feed');
      });
  });

  it('should write statuses to mongodb', () => {
    stubs[REQUEST].yields(null, {statusCode: 200, body: XML});
    stubs[NEWSFEED].upsertAndReturnNewStatuses.resolves();

    return mod()
      .then(() => {
        expect(stubs[NEWSFEED].upsertAndReturnNewStatuses.calledOnce).toBe(true);
        expect(stubs[NEWSFEED].upsertAndReturnNewStatuses.getCall(0).args[0]).toEqual(
          require('fixtures/redhat-mobile-status.json')
        );
      });
  });

});
