var Board = require('../../models').Board

module.exports = function initializeBoard(req, res, next) {
  Board.findOneAndPopulate({ _id: req.params._id }).then(function (board) {
    req.board = board;
    next();
  }).error(function () {
    res.status(404).end();
  }).catch(Error, function (err) {
    logger.error(err.message);
    res.status(500).end();
  })
};
