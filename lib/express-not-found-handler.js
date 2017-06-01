'use strict';

const log = require('fh-bunyan').getLogger(__filename);

module.exports = function notFoundHandler (req, res){
  log.warn(`a client requested ${req.originalUrl}, but we have no route handler defined for it`);
  
  res.status(404).json({
    message: '404 not found'
  });
};
