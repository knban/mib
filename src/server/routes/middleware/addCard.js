var Card = require('../../models').Card
  , Column = require('../../models').Column

module.exports = function addCard(req, res, next) {
  console.log(req.body);
  // Card.create(req.attributes)
  res.status(201).end();
}