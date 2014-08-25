var Card = require('../../models').Card
  , Column = require('../../models').Column

module.exports = function addCard(req, res, next) {
  Card.create({
    column: req.params['id'],
    provider: req.body['provider'],
    remoteObject: req.body['remoteObject']
  }, function(err, card) {
    if(err) {
      res.status(500).send(err);
      return;
    }
    Column.findByIdAndMutate(card.column, function (column) {
      column.cards.splice(column.cards.indexOf(card._id), 1);
      column.cards.splice(0, 0, card._id);
    }).then(function () {
      res.status(201).send({card: card});
    }).catch(function (err) {
      logger.error(err.message);
      res.status(500).end();
    });
  })
}
