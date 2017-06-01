'use strict';

const sinon = require('sinon');
const expect = require('expect');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe(__filename, () => {
  const FH = 'fh-mbaas-api';
  const NEWSFEED = './newsfeed';
  const RESOURCES = './resources';

  let stubs, mod;

  beforeEach(() => {
    stubs = {
      [FH]: {
        sync: {
          init: sinon.stub(),
          handleList: sinon.stub()
        }
      },
      [NEWSFEED]: {
        handleList: sinon.spy()
      },
      [RESOURCES]: {
        handleList: sinon.spy()
      }
    };

    mod = proxyquire('./index.js', stubs);
  });

  describe('#init', () => {
    it('should initialise all datasets', () => {
      stubs[FH].sync.init.yields(null); // mimic init success

      return mod.init()
        .then(() => {
          // Make sure no extra calls were made
          expect(stubs[FH].sync.init.calledTwice).toBe(true);
          expect(stubs[FH].sync.handleList.calledTwice).toBe(true);

          // Ensure init was called for each unique dataset
          expect(stubs[FH].sync.init.calledWith('newsfeed', {})).toBe(true);
          expect(stubs[FH].sync.init.calledWith('resources', {})).toBe(true);

          // Ensure handler for list is passed
          expect(stubs[FH].sync.handleList.calledWith('newsfeed', stubs[NEWSFEED].handleList)).toBe(true);
          expect(stubs[FH].sync.handleList.calledWith('resources', stubs[RESOURCES].handleList)).toBe(true);
        });
    });
  });

});


// 'use strict';
//
// const Promise = require('bluebird');
// const VError = require('verror');
// const sync = Promise.promisifyAll(require('fh-mbaas-api').sync);
// const join = require('path').join;
// const log = require('fh-bunyan').getLogger(__filename);
// const fs = require('fs');
//
// // folders in this directory are sync collections, so get them as a list
// const datasets = fs.readdirSync(join(__dirname))
//   .filter((e) => fs.statSync(join(__dirname, e)).isDirectory());
//
// exports.init = function () {
//   log.info('initialise sync framework');
//
//   // Loop over each sync dataset and initialise it and it's handlers
//   return Promise.map(datasets, (dname) => {
//     log.info('initialising dataset %s', dname);
//
//     const handlers = require(join(__dirname, dname));
//
//     return sync.initAsync(dname, {})
//       .then(() => {
//         sync.handleList(dname, handlers.handleList);
//       })
//       .catch((e) => {
//         throw new VError(e, 'failed to initialise dataset %s', dname);
//       });
//   });
// };
