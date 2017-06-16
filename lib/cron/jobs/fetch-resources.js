'use strict';

const CronMasterJob = require('cron-master').CronMasterJob;

module.exports = new CronMasterJob({
  // warn if the job is running for over 2 mins
  timeThreshold: 2 * 60 * 1000,

  meta: {
    name: __filename
  },

  cronParams: {
    cronTime: '*/2 * * * *',
    onTick: require('../fetch-resources.handler.js')
  }
});
