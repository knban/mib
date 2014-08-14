var Board = require('../../models').Board

module.exports = function deleteBoard(req, res, next) {
  req.board.remove(function(err) {
    if (err) {
      logger.error(err.message);
      res.status(500).end();
    } else {
      res.status(204).end();
    }
  });
}
