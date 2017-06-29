'use strict';

const sinon = require('sinon');
const expect = require('expect');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

require('sinon-as-promised')(require('bluebird'));

describe.only(__filename, () => {
  let mod, stubs;

  const USERPREFS = 'lib/dao/userprefs';
  const FH = 'fh-mbaas-api';

  beforeEach(() => {
    stubs = {
      [FH]: {
        push: sinon.stub()
      },
      [USERPREFS]: {
        getUsersForExceededThresholds: sinon.stub()
      }
    };

    mod = proxyquire(__filename.replace('.test.js', ''), stubs);
  });

  describe('#sendResourceUsagePush', () => {
    const usageinfo = {
      'acme-dev': {
        apps: [],
        resources: {},
        ts: Date.now()
      },
      'acme-live': {
        apps: [],
        resources: {},
        ts: Date.now()
      }
    };

    it('should not make a push call', () => {
      stubs[USERPREFS].getUsersForExceededThresholds.resolves({
        'acme-live': [],
        'acme-dev': []
      });

      return mod.sendResourceUsagePush(usageinfo)
        .then(() => {
          expect(stubs[FH].push.called).toBe(false);
        });
    });

    it('should send a push to a single user for "acme-dev"', () => {
      // Simulate push success
      stubs[FH].push.yields(null);

      // Simulate a single user who needs to be notified for acme-dev
      stubs[USERPREFS].getUsersForExceededThresholds.resolves({
        'acme-live': [],
        'acme-dev': [
          {
            username: 'jdoe@acme.com',
            userprefs: {
              notificationConfigs: {
                global: {
                  'acme-dev': {/* normally this has thresholds */}
                }
              }
            }
          }
        ]
      });

      return mod.sendResourceUsagePush(usageinfo)
        .then(() => {
          const msg = 'Resource usage in your acme-dev environment is exceeding desired threholds! You should investiagte why!';
          expect(stubs[FH].push.calledOnce).toBe(true);
          expect(stubs[FH].push.calledWith(msg, {
            broadcast: true,
            criteria: {
              alias: ['jdoe@acme.com']
            }
          })).toBe(true);
        });
    });
  });

});
