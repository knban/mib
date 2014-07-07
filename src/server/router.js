var express = require('express');
var r = module.exports = express.Router();
var _ = require('lodash');
var logger = require('winston');
var Promise = require('bluebird');

var Models = require('./models'),
Board = Models.Board,
Column = Models.Column,
Card = Models.Card,
User = Models.User;

var providers = require('../providers');

/*
 * GET /session -- get your user session
 * POST /session -- get your token
 */

r.route('/session')
.get(loginRequired, getSession)
.post(createSession);

function loginRequired(req, res, next) {
  var token = req.headers['x-auth-token'];
  if (token) {
    User.findOne({ token: token }).exec(function (err, user) {
      if (err) {
        logger.error(err.message)
        res.send(500)
      } else if (user) {
        req.user = user;
        next();
      } else {
        res.send(401);
      }
    })
  } else {
    res.send(401)
  }
};


function getSession(req, res, next) {
  res.send(req.user);
};

function createSession(req, res, next) {
  User.findOrCreateByAuthorization(req.body, providers, function (err, user) {
    if (err) {
      res.send(401);
    } else {
      res.send(201, { token: user.token, _id: user._id });
    }
  });
}

/*
 * GET /boards
 * POST /boards
 */

r.route('/boards')
.all(loginRequired)
.get(myBoards)
.post(createBoard);

function myBoards(req, res, next) {
  Board.find({ authorizedUsers: req.user._id }, { name:1 }, function (err, boards) {
    if (err) { res.send(500) }
    else { res.send({boards: boards}) }
  });
};

function createBoard(req, res, next) {
  if (req.body.jsonImport) {
    res.send(500, 'Not yet implemented');
  } else {
    Board.createWithDefaultColumns({
      name: req.body.name,
      authorizedUsers: [req.user._id]
    }).then(function (board) {
      res.send(201, { board: { _id: board._id }});
    }).catch(function (err) {
      logger.error(err.message);
      res.send(500);
    });
  }
};


/*
 * GET /boards/:_id
 */

r.route('/boards/:_id')
.all(loginRequired)
.all(initializeBoard)
.get(getBoard)
.delete(deleteBoard);

function initializeBoard(req, res, next) {
  Board.findOneAndPopulate({ _id: req.params._id }).then(function (board) {
    req.board = board;
    next();
  }).error(function () {
    res.send(404);
  }).catch(Error, function (err) {
    logger.error(err.message);
    res.send(500);
  })
};

function getBoard(req, res, next) {
  res.send({ board: req.board });
}

function deleteBoard(req, res, next) {
  req.board.remove(function(err) {
    if (err) {
      logger.error(err.message);
      res.send(500)
    } else {
      res.send(204);
    }
  });
}

/*
 * PUT /boards/:_id/links/:provider
 * Link a board with remote objects (e.g. repositories) from a provider
 */

r.route('/boards/:_id/links/:provider')
.all(loginRequired)
.all(initializeBoard)
.put(updateBoardLinks);

function updateBoardLinks(req, res, next) {
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
    if (err) { res.send(500, err.message); }
    else { res.send({ links: board.links }) }
  });
};

/*
 * POST /boards/:id/cards/:provider
 * Import cards into the board using the provider
 */

r.route('/boards/:_id/cards/:provider')
.post(loginRequired,
      initializeBoard,
      initializeFirstColumn,
      initializeCardHandler,
      importCardsViaProvider,
      saveCardsViaPromises,
      initializeBoard,
      sendBoardColumns
     );

function initializeFirstColumn(req, res, next) {
  Column.findOne({ board: req.board._id, role: 1 })
  .exec(function (err, column) {
    if (err) {
      logger.error(err.message);
      res.send(500);
    } else {
      req.column = column;
      next();
    }
  });
};

function initializeCardHandler(req, res, next) {
  req.handler = providers[req.params.provider].cardHandler;
  next();
};

function importCardsViaProvider(req, res, next) {
  req.promises = [];
  req.handler.batchImport(req.board, req.body, function (attributes) {
    attributes.column = req.column._id;
    req.promises.push(Card.create(attributes))
  }, next);
};

function saveCardsViaPromises(req, res, next) {
  Promise.all(req.promises).then(function () {
    req.board.update({ columns: req.board.columns }, function(err) {
      if (err) res.send(500, err.message);
      else next()
    });
  });
};

function sendBoardColumns(req, res, next) {
  res.send({ board: { columns: req.board.columns } });
};


/*
 *
 * ALL CODE BELOW IS UNTESTED
 *
 */


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

