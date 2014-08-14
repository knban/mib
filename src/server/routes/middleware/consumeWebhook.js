var Promise = require('bluebird')
  , models = require('../../models')
  , Card = models.Card
  , Column = models.Column

module.exports = function consumeWebhook(req, res, next) {
  var action = req.body.action;
  if (action === "opened") {
    var attrs = req.handler.newCard(req.params.repo_id, req.body.issue);
    Card.create(attrs, function (err, card) {
      if (err) {
        logger.error(err.message);
        res.status(500).end();
      } else {
        req.first_column.cards.push(card)
        req.first_column.save(function (err) {
          if (err) {
            logger.error(err.message);
            res.status(500).end();
          } else {
            res.status(204).end();
          }
        });
      }
    });
  } else if (action === "created" || action === "closed" || action === "reopened") {
    // TODO closed move to last column, reopened move to first column
    Card.findOne({ 'remoteObject.id': req.body.issue.id }, function (err, card) {
      if (err) { res.status(404).end(); } else { 
        card.remoteObject = req.body.issue;
        card.save(function (err) {
          if (err) {
            logger.error(err.message);
            res.status(500).end();
          } else {
            if (action === "closed") {
              Promise.all([
                Column.findByIdAndMutate(card.column, function (column) {
                  column.cards.splice(column.cards.indexOf(card._id), 1);
                }),
                Column.findByIdAndMutate(req.last_column, function (column) {
                  column.cards.splice(0, 0, card._id);
                })
              ]).then(function () {
                res.status(204).end();
              }).catch(function (err) {
                logger.error(err.message);
                res.status(500).end();
              });
            } else {
              res.status(204).end();
            }
          }
        });
      }
    })
  } else if (action) {
    logger.warn("webhook action '"+action+"' unhandled");
    res.status(501).end();
  } else {
    res.status(204).end();
  }
};
