var Column = require('../../models').Column

module.exports = function initializeLastColumn(req, res, next) {
  Column.findOne({ board: req.board._id, role: 2 })
  .exec(function (err, column) {
    if (err) {
      logger.error(err.message);
      res.status(500).end();
    } else {
      req.last_column = column;
      next();
    }
  });
};
