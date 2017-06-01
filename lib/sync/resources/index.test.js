'use strict';

const sinon = require('sinon');
const expect = require('expect');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Allow mocking of bluebird promises 
require('sinon-as-promised')(require('bluebird'));

describe(__filename, () => {
  const RESOURCES = 'lib/dao/resources';

  let stubs, mod;

  beforeEach(() => {
    stubs = {
      [RESOURCES]: {
        getLatestResources: sinon.stub()
      }
    };

    mod = proxyquire('./index.js', stubs);
  });

  describe('#handleList', () => {
    it('should return data minus the _id and ts', () => {
      stubs[RESOURCES].getLatestResources.resolves(require('fixtures/mongo/resources.json'));

      return mod.handleList()
        .then((data) => {
          expect(data).toExcludeKeys(['ts', '_id']);
          expect(data).toIncludeKeys(['acme-dev', 'acme-uat', 'acme-test']);
        });
    });
  });

});
