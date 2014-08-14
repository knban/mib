var Column = require('../../models').Column

module.exports = function initializeFirstColumn(req, res, next) {
  Column.findOne({ board: req.board._id, role: 1 })
  .exec(function (err, column) {
    if (err) {
      logger.error(err.message);
      res.status(500).end();
    } else {
      req.first_column = column;
      next();
    }
  });
};
