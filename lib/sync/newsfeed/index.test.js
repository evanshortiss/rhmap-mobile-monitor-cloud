'use strict';

const sinon = require('sinon');
const expect = require('expect');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Allow mocking of bluebird promises
require('sinon-as-promised')(require('bluebird'));

describe(__filename, () => {
  const NEWSFEED = 'lib/dao/status';

  let stubs, mod;

  beforeEach(() => {
    stubs = {
      [NEWSFEED]: {
        getRecentStatuses: sinon.stub()
      }
    };

    mod = proxyquire('./index.js', stubs);
  });

  describe('#handleList', () => {
    it('should return data in Object format', () => {
      stubs[NEWSFEED].getRecentStatuses.resolves(require('fixtures/mongo/newsfeed.json'));

      return mod.handleList()
        .then((data) => {
          expect(data).toBeAn(Object);
          expect(data).toIncludeKeys([
            '592f7e908b43066ae4afe5b4',
            '592f7e488b43066ae4afe5ad',
            '592f7e488b43066ae4afe5ac',
            '592f7e488b43066ae4afe5ae',
            '592f7e488b43066ae4afe5ab',
            '592f7e908b43066ae4afe5b3',
            '592f7e908b43066ae4afe5b2',
            '592f7e908b43066ae4afe5b1',
            '592f7e908b43066ae4afe5b0',
            '592f7e488b43066ae4afe5af'
          ]);
        });
    });
  });

});
