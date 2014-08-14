var loginRequired = require('./middleware/loginRequired')
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
  , exportBoardAsJSON = require('./middleware/exportBoardAsJSON')
  , addAuthorizedUser = require('./middleware/addAuthorizedUser')
  , removeAuthorizedUser = require('./middleware/removeAuthorizedUser')
  , initializeLastColumn = require('./middleware/initializeLastColumn')
  , consumeWebhook = require('./middleware/consumeWebhook')

module.exports = function (r) {
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

  r.route('/boards/:_id/cards/:card_id/move')
  /*
   * PUT /boards/:id/cards/:card_id/move
   * Move cards around within columns and/or across columns
   */
  .put(loginRequired,
       initializeBoard,
       performCardMove);

  r.route('/boards/:_id/export.json')
  /*
   * GET /boards/:id/export.json
   * Export an entire board as human and machine readable JSON
   *
   * TODO regression test
   */
  .get(loginRequired,
       initializeBoard,
       exportBoardAsJSON);

  r.route('/boards/:_id/authorizedUsers/:user_id')
  .all(loginRequired, initializeBoard)
  /*
   * PUT /boards/:id/users
   * Update a board's authorized users list
   * TODO regression test
   */
  .post(addAuthorizedUser)
  .delete(removeAuthorizedUser);

  r.route('/boards/:_id/:provider/:repo_id/webhook')
  /*
   * POST /boards/:id/:provider/:repo_id/webhook
   * Webhook for 3rd party services to update the cards
   * FIXME add security, check https://developer.github.com/webhooks/securing/
   */
  .post(initializeBoard,
        initializeFirstColumn,
        initializeLastColumn,
        initializeCardHandler,
        consumeWebhook);
}
