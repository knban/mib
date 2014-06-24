var express = require('express');
var r = module.exports = express.Router();

r.get('/session.json', function(req, res, next) {
  res.send(req.session);
});

var Board = require('./models/board');

r.get('/boards/:id', function(req, res, next) {
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

// Deleting columns
r.delete('/boards/:id/columns/:col', function (req, res, next) {
  Board.find({ id: req.params.id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var board = boards[0];
      board.columns.splice(req.params.col, 1);
      Board.update({ _id: board._id }, { columns: board.columns }, function(err) {
        if (err) { res.send(500, err.message); }
        else { res.send({ board: board }); }
      });
    }
  });
});

// Deleting cards
r.delete('/boards/:id/columns/:col/cards/:row', function(req, res, next) {
  Board.find({ id: req.params.id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var board = boards[0];
      board.columns[req.params.col].cards.splice(req.params.row, 1);
      Board.update({ _id: board._id }, { columns: board.columns }, function(err) {
        if (err) { res.send(500, err.message); }
        else { res.send({ board: board }); }
      });
    }
  });
});

var _ = require('lodash');

// Importing cards from Github
r.post('/boards/:id/columns/:col/cards/import/github', function(req, res, next) {
  Board.find({ id: req.params.id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var board = boards[0];
      _.each(req.body.openIssues, function(issue) {
        board.columns[req.params.col].cards.push({
          title: issue.title
        });
      });
      Board.update({ _id: board._id }, { columns: board.columns }, function(err) {
        if (err) { res.send(500, err.message); }
        else { res.send({ board: { columns: board.columns } }) }
      });
    }
  });
})
