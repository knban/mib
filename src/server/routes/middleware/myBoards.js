var Board = require('../../models').Board

module.exports = function myBoards(req, res, next) {
  Board.find({ authorizedUsers: req.user._id }, { name:1 }, function (err, boards) {
    if (err) { res.status(500).end() }
    else { res.send({boards: boards}) }
  });
};
