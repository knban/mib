var express = require('express');
var r = module.exports = express.Router();
var _ = require('lodash');
var logger = require('winston');

var Models = require('./models'),
Board = Models.Board,
Column = Models.Column,
Card = Models.Card,
User = Models.User;

var providers = {
  github: require('../providers/github'),
  local: require('../providers/local')
}

function loginRequired(req, res, next) {
  var token = req.headers['x-auth-token'];
  if (token) {
    User.findOne({ token: token }).exec(function (err, user) {
      if (err || !user) { res.send(500) }
      else if (user) {
        req.user = user;
        user.identifier = user.session.provider+":"+user.session.uid; // tmp
        next();
      }
    })
  } else { res.send(401) }
};


function getBoardById(req, res, next) {
  Board.findOne({ _id: req.params._id }).populate('columns').exec(function(err, board) {
    if (err) { 
      logger.error(err.message)
      res.send(500)
    } else if (board) {
      Card.populate(board.columns, { path: 'cards' }, function(err) {
        if (err) {
          logger.error(err.message);
          res.send(500);
        } else {
          req.board = board;
          next();
        }
      });
    } else {
      logger.error("Board "+req.params._id+" not found");
      res.send(404);
    }
  });
};

/*
 * GET /session
 * POST /session
 * DELETE /session
 */

r.route('/session')
.get(loginRequired, function (req, res, next) {
  res.send({ session: req.user.session });
})
.post(function(req, res, next) {
  var user = new User();
  user.login(req.body, providers, function (err) {
    if (err) {
      res.send(401);
    } else {
      res.send(201, { token: user.token });
    }
  });
})
.delete(function (req, res, next) {
  // probably just delete the token on both sides
  req.user = null;
  req.session = null;
  res.send(204);
})

/*
 * GET /boards
 * POST /boards
 */

r.route('/boards')
.all(loginRequired)
.get(function (req, res, next) {
  Board.find({ authorizedUsers: req.user.identifier }, { name:1 }, function (err, boards) {
    if (err) { res.send(500) }
    else { res.send({boards: boards}) }
  });
})
.post(function(req, res, next) {
  var board = null;
  if (req.body.jsonImport) {
    // TODO see if this still works
    board = new Board(req.body.jsonImport);
    board.authorizedUsers = _.merge(board.authorizedUsers, req.user.identifier);
  } else {
    board = new Board();
    board.authorizedUsers = [req.user.identifier];
  }
  board.name = req.body.name;
  board.save(function(err, board) {
    if (err) 
      res.send(500);
    else
      res.send({ board: { _id: board._id }});
  });
})


/*
 * GET /boards/:_id
 */

r.route('/boards/:_id')
.all(loginRequired)
.all(getBoardById)
.get(function(req, res, next) {
  res.send({ board: req.board });
})


/*
 * POST /boards/:_idcolumns/:col/cards/import/:provider
 * Batch import issues as cards into a column using a provider's card handler
 */

r.route('/boards/:_id/columns/:col/cards/import/:provider')
.post(getBoardById, function(req, res, next) {
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
      var handler = providers[req.params.provider].cardHandler;
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
