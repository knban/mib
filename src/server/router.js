var express = require('express');
var r = module.exports = express.Router();
var _ = require('lodash');
var User = require('./user');
var Board = require('./models/board');
var Column = require('./models/column');
var Card = require('./models/card');

var providers = {
  github: require('../providers/github')
}

r.get('/session', function(req, res, next) {
  var user = new User(req.session);
  res.send({ session: user.session });
});

r.post('/session', function(req, res, next) {
  var user = new User(req.session);
  if (user.loggedIn) {
    res.send("you're already logged in");
  } else {
    // TODO Rate limit by IP so github doesnt get pissed off
    var authorizer = providers[req.body.provider].authorizer;
    user.login(authorizer(req.body.uid, req.body.pw), function () {
      if (user.loggedIn) {
        res.send(req.session);
      } else {
        res.send(401);
      }
    });
  }
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
  Board.findOne({ _id: req.params._id }).populate('columns').exec(function(err, board) {
    Card.populate(board.columns, { path: 'cards' }).exec(function(err) {
      if (err) {
        res.send(500);
      } else if (boards.length === 0) {
        res.send(404);
      } else {
        res.send({ board: boards[0] });
      }
    });
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

// Link Github
// TODO authorize collaborators
// TODO webhook sync changes to collaborators
r.post('/boards/:_id/columns/:col/cards/import/:provider', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var board = boards[0];
      var handler = providers[req.params.provider].cardHandler;
      handler.batchImport(board, req.body.openIssues, req.body.metadata, function() {
        Board.update({ _id: board._id }, { columns: board.columns }, function(err) {
          if (err) { res.send(500, err.message); }
          else { res.send({ board: { columns: board.columns } }) }
        });
      })
    }
  });
})

// Update a column
r.put('/boards/:_id/columns/:col/cards', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var board = boards[0];
      board.columns[req.params.col].cards = req.body.cards;
      Board.update({ _id: board._id }, { columns: board.columns }, function(err) {
        if (err) { res.send(500, err.message); }
        else { res.send(204) }
      });
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
      return card.remoteObject.id == issue.id;
    })
  })) { 
    cb(null, col, row);
  } else {
    cb(new Error("Card not found"));
  }
};

// FIXME secure this route https://developer.github.com/webhooks/securing/
r.post('/boards/:_id/:provider/:repo_id/webhook', function(req, res, next) {
  Board.find({ _id: req.params._id }, function(err, boards) {
    if (err) {
      res.send(500);
    } else if (boards.length === 0) {
      res.send(404);
    } else {
      var handler = handlers[req.params.provider];
      var action = req.body.action;
      var board = boards[0];
      var persistColumns = function() {
        Board.update({ _id: board._id }, { columns: board.columns }, function(err) {
          if (err) { res.send(500, err.message); }
          else { res.send(204) }
        });
      }
      if (req.body.action === "opened") {
        var card = handler.newCard(req.params.repo_id, req.body.issue);
        board.columns[0].cards.push(card)
        persistColumns();
      } else if (action === "created" || action === "closed" || action === "reopened") {
        // TODO closed move to last column, reopened move to first column
        findCardPosition(board, req.body.issue, function (err, col, row) {
          if (err) { res.send(404) } else { 
            var card = board.columns[col].cards[row];
            card.remoteObject = req.body.issue;
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
    var board = null;
    if (req.body.jsonImport) {
      board = new Board(req.body.jsonImport);
      board.authorizedUsers = _.merge(board.authorizedUsers, user.identifier);
    } else {
      board = new Board();
      board.columns = [{
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
      board.authorizedUsers = [user.identifier];
    }
    board.name = req.body.name;
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
r.put('/boards/:_id/links/:provider', function(req, res, next) {
  Board.findById( req.params._id, function(err, board) {
    if (err) {
      res.send(500);
    } else {
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
        if (err) { res.send(500, err.message); }
        else { res.send({ links: board.links }) }
      });
    }
  });
});

// Update a board's authorized users list
r.put('/boards/:_id/users', function(req, res, next) {
  Board.findById( req.params._id, function(err, board) {
    if (err) {
      res.send(500);
    } else {
      board.authorizedUsers = _.uniq(board.authorizedUsers.concat(req.body.authorizedUsers));
      Board.update({ _id: board._id }, { authorizedUsers: board.authorizedUsers }, function(err) {
        if (err) { res.send(500, err.message); }
        else { res.send({ authorizedUsers: board.authorizedUsers }) }
      });
    }
  });
});
