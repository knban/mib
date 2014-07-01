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

// Link Github
// TODO authorize collaborators
// TODO webhook sync changes to collaborators
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

var findCardPosition = function (board, issue, cb) {
  var col, row, card, column = null;
  if (_.find(board.columns, function (column, i) {
    col = i;
    return _.find(column.cards, function (c, j) {
      row = j;
      card = c
      return card.id == issue.id;
    })
  })) { 
    cb(null, col, row);
  } else {
    cb(new Error("Card not found"));
  }
};

// FIXME secure this route https://developer.github.com/webhooks/securing/
r.post('/boards/:_id/webhooks/github', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var action = req.body.action;
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
      } else if (action === "created" || action === "closed" || action === "reopened") {
        // TODO closed move to last column, reopened move to first column
        findCardPosition(board, req.body.issue, function (err, col, row) {
          if (err) { res.send(404) } else { 
            board.columns[col].cards[row] = req.body.issue;
            persistColumns();
          }
        })
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
      var board = boards[0];
      var beautify = require('js-beautify').js_beautify;
      output = beautify(JSON.stringify(board), { indent_size: 2});
      res.set("Content-Disposition", 'attachment; filename="'+board.name+'.json"');
      res.send(output);
    }
  })
});

// Create/import board
r.post('/boards', function(req, res, next) {
  var user = new User(req.session);
  if (user.loggedIn) {
    var board = new Board({
      name: req.body.name,
      authorizedUsers: [ user.identifier ],
      columns: (req.body.columns || [{
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
      }])
    });
    board.save(function(err, board) {
      if (err) 
        res.send(500);
      else
        res.send({ board: { _id: board._id }});
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


// Update a board's link with a provider repository
r.put('/boards/:_id/links/:provider/:repo_id', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var board = boards[0];
      var links = board.links || {};
      var repo = {};
      repo[req.params.repo_id] = req.body.repo;
      links[req.params.provider] = repo;
      board.links = links;
      Board.update({ _id: board._id }, { links: links }, function(err) {
        if (err) { res.send(500, err.message); }
        else { res.send({ board: { links: board.links } }) }
      });
    }
  });
});
