var Card = require('../../models').Card
  , Column = require('../../models').Column

module.exports = function addCard(req, res, next) {
  var obj = {
    column: req.params['id'],
    provider: req.body['provider'],
    remoteObject: req.body['remoteObject']
  }
  Card.create(obj, function(err, card) {
    if(err) {
      res.status(500).send(err);
      return;
    }
    res.status(201).end();
  })
  
}