var Card = require('../../models').Card

module.exports = function importCardsViaProvider(req, res, next) {
  req.promises = [];
  req.handler.batchImport(req.board, req.body, function (attributes) {
    attributes.column = req.first_column._id;
    req.promises.push(Card.create(attributes))
  }, next);
};
