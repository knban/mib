var express = require('express');
var r = module.exports = express.Router();

r.get('/session.json', function(req, res, next) {
  res.send(req.session);
});

var Board = require('./models/board');

r.get('/board/:id', function(req, res, next) {
  Board.find({ id: '1' }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      res.send({ board: boards[0] });
    }
  });
});
