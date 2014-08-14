var Column = require('../../models').Column
  , Promise = require('bluebird')

module.exports = function performCardMove(req, res, next) {
  if (req.body.old_column === req.body.new_column) {
    Column.findByIdAndMutate(req.body.old_column, function (column) {
      column.cards.splice(column.cards.indexOf(req.params.card_id), 1);
      column.cards.splice(req.body.new_index, 0, req.params.card_id);
    }).then(function () {
      res.status(204).end();
    }).catch(function (err) {
      logger.error(err.message);
      res.status(500).end();
    });
  } else {
    Promise.all([
      Column.findByIdAndMutate(req.body.old_column, function (column) {
        column.cards.splice(column.cards.indexOf(req.params.card_id), 1);
      }),
      Column.findByIdAndMutate(req.body.new_column, function (column) {
        column.cards.splice(req.body.new_index, 0, req.params.card_id);
      })
    ]).then(function () {
      res.status(204).end();
    }).catch(function (err) {
      logger.error(err.message);
      res.status(500).end();
    });
  }
};

