var _ = {
  find: require('lodash.find')
},
ProjectLinker = require('../project_linker'),
BoardCreator = require('../board_creator'),
UserMod = require('../user_mod');

module.exports = ['$http', function($http) {
  var board = this;
  this.projectLinker = new ProjectLinker(board, localStorage, $http);
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

  /*
   * Drag and Drop 
   * */

  this.moveCardWithinColumn = function ($col, $event) {
    var column = board.attributes.columns[$col];
    column.isSyncing = true;
    var cards = column.cards;
    var $el = $($event.target);
    var newIndex = $el.index();
    var id = $($el).data('id');
    var oldIndex = null;
    var card = _.find(cards, function (c, i) {
      oldIndex = i;
      return c._id === id;
    });
    cards.splice(oldIndex, 1);
    cards.splice(newIndex, 0, card);
    api.put('boards/'+board.attributes._id+'/cards/'+card._id+'/move', {
      old_column: column._id,
      new_column: column._id,
      new_index: newIndex
    }).success(function(){
      column.isSyncing = false;
    }).error(function () {
      alert('something is wrong');
    });
  };

  // removeCardFromColumn is always hit first in
  // a cross-column card drag event
  var colJustRemovedFrom = null;
  this.removeCardFromColumn = function ($col, $event) {
    colJustRemovedFrom = $col;
    // The event we get out of this is the <ul>
    // and so we cannot identify the card until the
    // addCardToColumn method is hit.
  };

  this.addCardToColumn = function ($col, $event) {
    var column1 = board.attributes.columns[colJustRemovedFrom];
    column1.isSyncing = true;
    var column2 = board.attributes.columns[$col];
    column2.isSyncing = true;
    var oldDeck = column1.cards;
    var newDeck = column2.cards;
    var $el = $($event.target);
    var newIndex = $el.index();
    var id = $($el).data('id');
    var oldIndex = null;
    var card = _.find(oldDeck, function (c, i) {
      oldIndex = i;
      return c._id === id;
    });
    oldDeck.splice(oldIndex, 1);
    newDeck.splice(newIndex, 0, card);
    api.put('boards/'+board.attributes._id+'/cards/'+card._id+'/move', {
      old_column: column1._id,
      new_column: column2._id,
      new_index: newIndex
    }).success(function(){
      column1.isSyncing = false;
      column2.isSyncing = false;
    }).error(function () {
      alert('something is wrong');
    });
  };
}]
