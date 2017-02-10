'use strict';

const CronMasterJob = require('cron-master').CronMasterJob;

module.exports = new CronMasterJob({
  timeThreshold: 2 * 60 * 1000,

  meta: {
    name: __filename
  },

  cronParams: {
    cronTime: '*/1 * * * *',
    onTick: require('../fetch-resources.handler.js')
  }
});
