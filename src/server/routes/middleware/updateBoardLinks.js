var Board = require('../../models').Board
  , _ = require('lodash')

module.exports = function updateBoardLinks(req, res, next) {
  var board = req.board;
  if (! board.links ) {
    board.links = {};
  }
  if (! board.links[req.params.provider]) {
    board.links[req.params.provider] = {}
  }
  _.each(req.body[req.params.provider], function (repo) {
    board.links[req.params.provider][repo.id] = repo;
  });
  Board.update({ _id: board._id }, { links: board.links }, function(err) {
    if (err) { res.status(500).send(err.message); }
    else { res.send({ links: board.links }) }
  });
};
