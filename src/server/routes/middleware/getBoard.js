var Board = require('../../models').Board

module.exports = function getBoard(req, res, next) {
  res.send({ board: req.board });
}
