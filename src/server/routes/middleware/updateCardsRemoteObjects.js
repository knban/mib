var Promise = require('bluebird')
  , Card = require('../../models').Card

module.exports = function updateCardsRemoteObjects(req, res, next) {
  Promise.all(_.map(req.body.cards, function (card) {
    return Card.updateRemoteObject(card);
  })).then(function () { res.status(200).end() });
};
