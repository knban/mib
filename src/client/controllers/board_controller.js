var _ = {
  find: require('lodash.find'),
  map: require('lodash.map')
},
providers = require('../../providers'),
ProjectLinker = require('../project_linker'),
BoardCreator = require('../board_creator'),
UserMod = require('../user_mod');

module.exports = ['$http', function($http) {
  var board = this;
  board.loaded = false;
  this.providers = providers.prepare(localStorage, $http, this, window.api);
  this.projectLinker = new ProjectLinker(this, $http);
  this.userMod = new UserMod(board, $http);
  this.creator = new BoardCreator(this, $http);
  this.unload = function (preventClearLastBoard) {
    board.loaded = false;
    board.attributes = null;
    this.projectLinker.close();
    if (! preventClearLastBoard) {
      localStorage.removeItem('lastBoardId')
    }
  };
  this.load = app.loadBoard = function (attributes) {
    app.board = this; // for debug
    board.creator.isOpen = false;
    board.attributes = attributes;
    board.loaded = true;
    localStorage.lastBoardId = attributes._id;
    setTimeout(this.refreshBoardData, 5000); // do this later to improve UX
  };
  this.loadBoardById = app.loadBoardById = function (_id) {
    if (board.loaded && board.attributes._id === _id)
      return
    board.loaded = false;
    api.get('boards/'+_id).success(function (data) {
      board.load(data.board)
    }).error(function () {
      localStorage.removeItem('lastBoardId')
    });
  };

  this.addCard = function(col, body) {
    api.post('boards/'+board.attributes._id+'/columns/'+col+'/cards', body).success(function(data) {
      if (data.board)
        board.attributes.columns[col] = data.board.columns[col];
    });
  }


  this.logCard = function(card) {
    console.log(card);
  }

  this.deleteBoard = function () {
    if (confirm("Are you sure you wish to delete this board and all its cards? Make sure to backup using the export tool!")) {
      api.delete('boards/'+board.attributes._id).success(function() {
        board.unload();
        app.updateBoardList();
      });
    }
  };

  this.repo = function (card) {
    return this.attributes.links[card.provider][card.repo_id];
  };

  this.refreshBoardData = function () {
    _.map(board.attributes.links, function (link, provider_id) {
      _.map(link, function (repo, id) {
        board.providers[provider_id].refreshCards(repo, function () {});
      });
    });
  };
}]
