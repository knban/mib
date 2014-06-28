var express = require('express');
var r = module.exports = express.Router();
var _ = require('lodash');
var User = require('./user');
var Board = require('./models/board');

r.get('/session.json', function(req, res, next) {
  res.send(req.session);
});

r.get('/boards/index', function (req, res, next) {
  var user = new User(req.session);
  if (user.loggedIn) {
    Board.find({ authorizedUsers: user.identifier }, { name:1 }, function (err, boards) {
      if (err) { res.send(500) }
      else {
        res.send({boards: boards})
      }
    });
  } else {
    res.send(401);
  }
});

r.get('/boards/:_id', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
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
r.delete('/boards/:_id/columns/:col', function (req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
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
r.delete('/boards/:_id/columns/:col/cards/:row', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
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
r.post('/boards/:_id/columns/:col/cards/import/github', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
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
r.put('/boards/:_id/columns/:col/cards/:row/move/:direction', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
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

r.post('/boards/:_id/webhooks/github', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
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

// Export a board as JSON
r.get('/boards/:_id/export.json', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var beautify = require('js-beautify').js_beautify;
      output = beautify(JSON.stringify(boards[0]), { indent_size: 2});
      res.set("Content-Disposition", 'attachment; filename="board.json"');
      res.send(output);
    }
  })
});

// Importing a board via JSON
r.post('/boards/:_id/import', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var board = boards[0];
      Board.update({ _id: board._id }, req.body, function(err) {
        if (err) { res.send(500, err.message); }
        else { res.send(204) }
      });
    }
  });
})



// Creating a new board
r.post('/boards', function(req, res, next) {
  var user = new User(req.session);
  if (user.loggedIn) {

    /* 
     * This is how you get the data back out 
    Board.find({ authorizedUsers: user.identifier }, function(error, models) {
      //put code to process the results here
      //});
     */
    var board = new Board({
      name: req.body.name,
      authorizedUsers: [ user.identifier ],
      columns: [{
        name: "Icebox",
        cards: []
      },{
        name: "Backlog",
        cards: []
      },{
        name: "Doing",
        cards: []
      },{
        name: "Done",
        cards: []
      }]
    });
    board.save(function(err, board) {
      if (err) 
        res.send(500);
      else
        res.send({ board: board });
    });
  } else {
    res.send(401);
  }
})


// Deleting a board
r.delete('/boards/:_id', function(req, res, next) {
  var user = new User(req.session);
  if (user.loggedIn) {
    Board.find({
      _id: req.params._id,
      authorizedUsers: user.identifier
    }).remove(function(err) {
      if (err) { res.send(500) }
      else {
        res.send(204);
      }
    });
  } else {
    res.send(401);
  }
});
