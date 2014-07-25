var express = require('express');
var r = module.exports = express.Router();
var _ = require('lodash');
var logger = require('winston');
var Promise = require('bluebird');

var ObjectId = require('mongoose').Types.ObjectId; 
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
  var token = req.headers['x-auth-token'] || req.query.token;
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
    Board.createViaImport(req.body.jsonImport, {
      name: req.body.name,
      authorizedUsers: [req.user._id]
    }).then(function (board) {
      res.send(201, { board: { _id: board._id }});
    }).catch(function (err) {
      logger.error(err.message);
      res.send(500);
    });
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
      sendBoardColumns);

function initializeFirstColumn(req, res, next) {
  Column.findOne({ board: req.board._id, role: 1 })
  .exec(function (err, column) {
    if (err) {
      logger.error(err.message);
      res.send(500);
    } else {
      req.first_column = column;
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
    attributes.column = req.first_column._id;
    req.promises.push(Card.create(attributes))
  }, next);
};

function saveCardsViaPromises(req, res, next) {
  Promise.all(req.promises).spread(function () {
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
 * PUT /boards/:id/cards
 * Batch update cards
 *
 * TODO regression test
 */

r.route('/boards/:_id/cards')
.put(loginRequired,
     initializeBoard,
     updateCardsRemoteObjects);

function updateCardsRemoteObjects(req, res, next) {
  Promise.all(_.map(req.body.cards, function (card) {
    return Card.updateRemoteObject(card);
  })).then(function () { res.send(200) });
};

/*
 * PUT /boards/:id/cards/:card_id/move
 * Move cards around within columns and/or across columns
 */

r.route('/boards/:_id/cards/:card_id/move')
.put(loginRequired,
     initializeBoard,
     performCardMove);

function performCardMove(req, res, next) {
  if (req.body.old_column === req.body.new_column) {
    Column.findByIdAndMutate(req.body.old_column, function (column) {
      column.cards.splice(column.cards.indexOf(req.params.card_id), 1);
      column.cards.splice(req.body.new_index, 0, req.params.card_id);
    }).then(function () {
      res.send(204)
    }).catch(function (err) {
      logger.error(err.message);
      res.send(500)
    });
  } else {
    Promise.all([
      Column.findByIdAndMutate(req.body.old_column, function (column) {
        column.cards.splice(column.cards.indexOf(req.params.card_id), 1);
      }),
      Column.findByIdAndMutate(req.body.new_column, function (column) {
        column.cards.splice(req.body.new_index, 0, req.params.card_id);
      })
    ]).then(function () {
      res.send(204)
    }).catch(function (err) {
      logger.error(err.message);
      res.send(500)
    });
  }
};

/*
 * GET /boards/:id/export.json
 * Export an entire board as human and machine readable JSON
 */

// TODO regression test
r.route('/boards/:_id/export.json')
.get(loginRequired,
     initializeBoard,
     exportBoardAsJSON);

function exportBoardAsJSON(req, res, next) {
  var beautify = require('js-beautify').js_beautify;
  output = beautify(JSON.stringify(req.board), { indent_size: 2 });
  res.set("Content-Disposition", 'attachment; filename="'+req.board.name+'.json"');
  res.send(output);
};

/*
 * PUT /boards/:id/users
 * Update a board's authorized users list
 */

// TODO regression test
r.route('/boards/:_id/authorizedUsers/:user_id')
.all(loginRequired, initializeBoard)
.post(addAuthorizedUser)
.delete(removeAuthorizedUser);

function addAuthorizedUser(req, res, next) {
  try {
    var user_id = ObjectId(req.params.user_id);
    if (req.board.authorizedUsers.indexOf(user_id) >= 0) {
      res.send(400, 'user already authorized');
    } else {
      req.board.authorizedUsers.push(user_id);
      req.board.save(function(err, board) {
        if (err) { res.send(500, err.message); }
        else { res.send({ authorizedUsers: board.authorizedUsers }) }
      });
    }
  } catch (err) {
    logger.error('addAuthorizedUser 400', err.message);
    res.send(400, err.message);
  }
};

function removeAuthorizedUser(req, res, next) {
  try {
    var user_id = ObjectId(req.params.user_id);
    var index = req.board.authorizedUsers.indexOf(user_id);
    if (index >= 0) {
      req.board.authorizedUsers.splice(index, 1);
      req.board.save(function(err, board) {
        if (err) { res.send(500, err.message); }
        else { res.send({ authorizedUsers: board.authorizedUsers }) }
      });
    } else {
      res.send(404, 'user not authorized');
    }
  } catch (err) {
    logger.error('removeAuthorizedUser 400', err.message);
    res.send(400, err.message);
  }
};

/*
 * POST /boards/:id/:provider/:repo_id/webhook
 * Webhook for 3rd party services to update the cards
 * FIXME add security, check https://developer.github.com/webhooks/securing/
 */

r.route('/boards/:_id/:provider/:repo_id/webhook')
.post(initializeBoard,
      initializeFirstColumn,
      initializeLastColumn,
      initializeCardHandler,
      consumeWebhook);


function initializeLastColumn(req, res, next) {
  Column.findOne({ board: req.board._id, role: 2 })
  .exec(function (err, column) {
    if (err) {
      logger.error(err.message);
      res.send(500);
    } else {
      req.last_column = column;
      next();
    }
  });
};

function consumeWebhook(req, res, next) {
  var action = req.body.action;
  if (action === "opened") {
    var attrs = req.handler.newCard(req.params.repo_id, req.body.issue);
    Card.create(attrs, function (err, card) {
      if (err) {
        logger.error(err.message);
        res.send(500)
      } else {
        req.first_column.cards.push(card)
        req.first_column.save(function (err) {
          if (err) {
            logger.error(err.message);
            res.send(500);
          } else {
            res.send(204);
          }
        });
      }
    });
  } else if (action === "created" || action === "closed" || action === "reopened") {
    // TODO closed move to last column, reopened move to first column
    Card.findOne({ 'remoteObject.id': req.body.issue.id }, function (err, card) {
      if (err) { res.send(404) } else { 
        card.remoteObject = req.body.issue;
        card.save(function (err) {
          if (err) {
            logger.error(err.message);
            res.send(500);
          } else {
            if (action === "closed") {
              Promise.all([
                Column.findByIdAndMutate(card.column, function (column) {
                  column.cards.splice(column.cards.indexOf(card._id), 1);
                }),
                Column.findByIdAndMutate(req.last_column, function (column) {
                  column.cards.splice(0, 0, card._id);
                })
              ]).then(function () {
                res.send(204)
              }).catch(function (err) {
                logger.error(err.message);
                res.send(500)
              });
            } else {
              res.send(204);
            }
          }
        });
      }
    })
  } else if (action) {
    logger.warn("webhook action '"+action+"' unhandled");
    res.send(501)
  } else {
    res.send(204)
  }
};
