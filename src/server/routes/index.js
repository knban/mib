var express = require('express')
  , r = module.exports = express.Router()
  , _ = require('lodash')
  , logger = require('winston')
  , Promise = require('bluebird')
  , ObjectId = require('mongoose').Types.ObjectId

  , Models = require('../models')
  , Board = Models.Board
  , Column = Models.Column
  , Card = Models.Card
  , User = Models.User

  , providers = require('../../providers')

  , loginRequired = require('./middleware/loginRequired')
  , getSession = require('./middleware/getSession')
  , createSession = require('./middleware/createSession')
  , myBoards = require('./middleware/myBoards')
  , createBoard = require('./middleware/createBoard')
  , initializeBoard = require('./middleware/initializeBoard')
  , getBoard = require('./middleware/getBoard')
  , deleteBoard = require('./middleware/deleteBoard')
  , updateBoardLinks = require('./middleware/updateBoardLinks')
  , initializeFirstColumn = require('./middleware/initializeFirstColumn')
  , initializeCardHandler = require('./middleware/initializeCardHandler')
  , importCardsViaProvider = require('./middleware/importCardsViaProvider')
  , saveCardsViaPromises = require('./middleware/saveCardsViaPromises')
  , sendBoardColumns = require('./middleware/sendBoardColumns')
  , updateCardsRemoteObjects = require('./middleware/updateCardsRemoteObjects')
  , performCardMove = require('./middleware/performCardMove')

r.route('/session')
/*
 * POST /session
 * Login and get back your token
 * Token must be sent in subsequent API requests via header X-Auth-Token
 * Request { provider: "local|github|etc", uid: "user", pw: "pass" }
 * Response { token: "..." }
 * Use this token via HTTP Header "X-Auth-Token" in all subsequent requests
 */
.post(createSession)
/*
 * GET /session
 * Get the contents of your session; i.e. 3rd party authorizations
 * Response { session: { authorizations: { github: { token: "..." } } } }
 */
.get(loginRequired, getSession)

r.route('/boards')
.all(loginRequired)
/*
 * GET /boards
 */
.get(myBoards)
/* 
 * POST /boards { name: "" }
 */
.post(createBoard);

r.route('/boards/:_id')
.all(loginRequired)
.all(initializeBoard)
/*
 * GET /boards/:_id
 */
.get(getBoard)
/*
 * DELETE /boards/:_id
 */
.delete(deleteBoard);

r.route('/boards/:_id/links/:provider')
.all(loginRequired)
.all(initializeBoard)
/*
 * PUT /boards/:_id/links/:provider
 * Link a board with remote objects (e.g. repositories) from a provider
 */
.put(updateBoardLinks);

r.route('/boards/:_id/cards/:provider')
/*
 * POST /boards/:id/cards/:provider
 * Import cards into the board using the provider
 */
.post(loginRequired,
      initializeBoard,
      initializeFirstColumn,
      initializeCardHandler,
      importCardsViaProvider,
      saveCardsViaPromises,
      initializeBoard,
      sendBoardColumns);

r.route('/boards/:_id/cards')
/*
 * PUT /boards/:id/cards
 * Batch update cards
 *
 * TODO regression test
 * TODO docs
 */
.put(loginRequired,
     initializeBoard,
     updateCardsRemoteObjects);

/*
 * PUT /boards/:id/cards/:card_id/move
 * Move cards around within columns and/or across columns
 */

r.route('/boards/:_id/cards/:card_id/move')
.put(loginRequired,
     initializeBoard,
     performCardMove);

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
      res.status(400).send('user already authorized');
    } else {
      req.board.authorizedUsers.push(user_id);
      req.board.save(function(err, board) {
        if (err) { res.status(500).send(err.message); }
        else { res.send({ authorizedUsers: board.authorizedUsers }) }
      });
    }
  } catch (err) {
    logger.error('addAuthorizedUser 400', err.message);
    res.status(400).send(err.message);
  }
};

function removeAuthorizedUser(req, res, next) {
  try {
    var user_id = ObjectId(req.params.user_id);
    var index = req.board.authorizedUsers.indexOf(user_id);
    if (index >= 0) {
      req.board.authorizedUsers.splice(index, 1);
      req.board.save(function(err, board) {
        if (err) { res.status(500).send(err.message); }
        else { res.send({ authorizedUsers: board.authorizedUsers }) }
      });
    } else {
      res.status(404).send('user not authorized');
    }
  } catch (err) {
    logger.error('removeAuthorizedUser 400', err.message);
    res.status(400).send(err.message);
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
      res.status(500).end();
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
        res.status(500).end();
      } else {
        req.first_column.cards.push(card)
        req.first_column.save(function (err) {
          if (err) {
            logger.error(err.message);
            res.status(500).end();
          } else {
            res.status(204).end();
          }
        });
      }
    });
  } else if (action === "created" || action === "closed" || action === "reopened") {
    // TODO closed move to last column, reopened move to first column
    Card.findOne({ 'remoteObject.id': req.body.issue.id }, function (err, card) {
      if (err) { res.status(404).end(); } else { 
        card.remoteObject = req.body.issue;
        card.save(function (err) {
          if (err) {
            logger.error(err.message);
            res.status(500).end();
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
                res.status(204).end();
              }).catch(function (err) {
                logger.error(err.message);
                res.status(500).end();
              });
            } else {
              res.status(204).end();
            }
          }
        });
      }
    })
  } else if (action) {
    logger.warn("webhook action '"+action+"' unhandled");
    res.status(501).end();
  } else {
    res.status(204).end();
  }
};

/*
 * POST /users
 * Creates a user
 * TODO needs regression test
 */

r.route('/users')
.post(createUserAndSession);

function createUserAndSession(req, res, next) {
  User.findOne({ email: req.body.email }, function (err, user) {
    if (user) res.status(406).send('email is in use. forgot password not yet implemented'); // TODO
    else {
      User.create({
        uid: req.body.email,
        email: req.body.email,
        hash: require('bcrypt').hashSync(req.body.password, 10),
        token: Math.random().toString(22).substring(2)
      }, function(err, user) {
        if (err) throw err;
        res.status(201).send({ token: user.token, _id: user._id });
      });
    }
  })
};

/*
 * POST /columns/:id/cards
 * Creates a card at the top of a column
 */

r.route('/column/:id/cards')

