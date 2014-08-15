var Board = require('../../models').Board
var logger = require('winston')

module.exports = function createBoard(req, res, next) {
  if (req.body.jsonImport) {
    Board.createViaImport(req.body.jsonImport, {
      name: req.body.name,
      authorizedUsers: [req.user._id]
    }).then(function (board) {
      res.status(201).send({ board: { _id: board._id }});
    }).catch(function (err) {
      logger.error(err.message);
      res.status(500).end();
    });
  } else {
    Board.createWithDefaultColumns({
      name: req.body.name,
      authorizedUsers: [req.user._id]
    }).then(function (board) {
      res.status(201).send({ board: { _id: board._id }});
    }).catch(function (err) {
      logger.error(err.message);
      res.status(500).end();
    });
  }
};

