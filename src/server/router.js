var express = require('express');
var r = module.exports = express.Router();
var _ = require('lodash');

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

var handler = require('../providers/github').cardHandler(_);

// Importing cards from Github
r.post('/boards/:id/columns/:col/cards/import/github', function(req, res, next) {
  Board.find({ id: req.params.id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var board = boards[0];
      handler.batchImport(board, req.body.openIssues, function() {
        Board.update({ _id: board._id }, { columns: board.columns }, function(err) {
          if (err) { res.send(500, err.message); }
          else { res.send({ board: { columns: board.columns } }) }
        });
      })
    }
  });
})

// Move a card
r.put('/boards/:id/columns/:col/cards/:row/move/:direction', function(req, res, next) {
  Board.find({ id: req.params.id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var board = boards[0];
      var Mover = function(popCard, done) {
        var row = parseInt(req.params.row);
        var col = parseInt(req.params.col);
        var directions = {
          up: function() {
            board.columns[col].cards.splice(row-1, 0, popCard());
            done();
          },
          down: function() {
            board.columns[col].cards.splice(row+1, 0, popCard());
            done();
          },
          left: function() {
            board.columns[col-1].cards.push(popCard());
            done();
          },
          right: function() {
            board.columns[col+1].cards.push(popCard());
            done();
          }
        };
        directions[req.params.direction]()
      };
      Mover(function() {
        return board.columns[req.params.col].cards.splice(req.params.row, 1)[0];
      }, function() {
        Board.update({ _id: board._id }, { columns: board.columns }, function(err) {
          if (err) { res.send(500, err.message); }
          else { res.send({ board: { columns: board.columns } }) }
        });
      })
    }
  });
});

r.post('/boards/:id/webhooks/github', function(req, res, next) {
  Board.find({ id: 1 }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var board = boards[0];
      var persistColumns = function() {
        Board.update({ _id: board._id }, { columns: board.columns }, function(err) {
          if (err) { res.send(500, err.message); }
          else { res.send(204) }
        });
      }
      if (req.body.action === "opened") {
        board.columns[0].cards.push(req.body.issue);
        persistColumns();
      } else {
        res.send(204)
      }
    }
  })
});
