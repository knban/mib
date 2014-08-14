var providers = require('../../../providers')

module.exports = function initializeCardHandler(req, res, next) {
  req.handler = providers[req.params.provider].cardHandler;
  next();
};
