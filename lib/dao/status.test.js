'use strict';

const expect = require('chai').expect;
const moment = require('moment');
const uncached = require('require-uncached');

describe(__filename, () => {
  const mod = require(__filename.replace('.test', ''));
  let data = null;

  beforeEach(() => {
    data = uncached('fixtures/redhat-mobile-status.json');

    // Make sure at least update is returned at anytime these tests are run
    // Wed, 12 Apr 2017 13:50:24 +0000
    data.channel.item[data.channel.item.length - 1].pubDate = moment().format(
      'ddd, DD MMM YYYY hh:mm:ss'
    );

    return mod.remove({}) // remove old data that might exist
      .then(() => mod.upsertAndReturnNewStatuses(data));
  });

  describe('#upsertAndReturnNewStatuses', () => {
    it('should insert the first status and return the "new" entry', () => {
      // Mimic a new entry being created
      data.channel.item[0].guid._Data = '1234567890';
      data.channel.item[0].pubDate = require('moment').utc();

      return mod.upsertAndReturnNewStatuses(data)
        .then((r) => {
          expect(r.length).to.equal(1);
          expect(r[0].title).to.be.a.string;
          expect(r[0].pubDate).to.be.a.string;
        });
    });

    it('should return any entries from the past month', () => {
      return mod.getRecentStatuses()
        .then((ret) => {
          expect(ret.length).to.be.above(0);
          expect(ret[0]).to.not.contain.key('content:encoded');
          expect(ret[0]).to.contain.keys(
            'category',
            'description',
            'link',
            'pubDate',
            'title'
          );
        });
    });
  });

});
