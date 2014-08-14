module.exports = function sendBoardColumns(req, res, next) {
  res.send({ board: { columns: req.board.columns } });
};
