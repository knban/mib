var ProjectLinker = require('../project_linker');
var BoardCreator = require('../board_creator');

module.exports = ['$http', function($http) {
  var board = this;
  this.projectLinker = new ProjectLinker(board, $http);
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
    board.creator.isOpen = false;
    board.attributes = attributes;
    board.loaded = true;
    localStorage.lastBoardId = attributes._id;
  };
  this.loadBoardById = app.loadBoardById = function (_id) {
    if (board.loaded && board.attributes._id === _id)
      return
    board.loaded = false;
    $http.get(api.route('boards/'+_id)).success(function (data) {
      board.load(data.board)
    }).error(function () {
      localStorage.removeItem('lastBoardId')
    });
  };
  this.removeColumn = function(col) {
    if (confirm("Are you sure you wish to delete this column and all its cards?")) {
      $http.delete(api.route('boards/'+board.attributes._id+'/columns/'+col)).success(function(data) {
        if (data.board)
          board.attributes.columns = data.board.columns;
      });
    }
  }
  this.removeCard = function(col, row) {
    if (confirm("Are you sure you wish to delete this card?")) {
      $http.delete(api.route('boards/'+board.attributes._id+'/columns/'+col+'/cards/'+row)).success(function(data) {
        if (data.board)
          board.attributes.columns = data.board.columns;
      });
    }
  },
  this.addCard = function(col, body) {
    $http.post(api.route('boards/'+board.attributes._id+'/columns/'+col+'/cards', body)).success(function(data) {
      if (data.board)
        board.attributes.columns[col] = data.board.columns[col];
    });
  }


  this.logCard = function(card) {
    console.log(card);
  }

  this.moveCard = function(direction, col, row) {
    $http.put(api.route('boards/'+board.attributes._id+'/columns/'+col+'/cards/'+row+'/move/'+direction)).success(function(data) {
      if (data.board)
        board.attributes.columns = data.board.columns;
    });
  }

  this.deleteBoard = function () {
    if (confirm("Are you sure you wish to delete this board and all its cards? Make sure to backup using the export tool!")) {
      $http.delete(api.route('boards/'+board.attributes._id)).success(function() {
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
  var _ = require('lodash');

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
      return c.remoteObject.id === id;
    });
    cards.splice(oldIndex, 1);
    cards.splice(newIndex, 0, card);
    $http.put(api.route('boards/'+board.attributes._id+'/columns/'+$col+'/cards'), { cards: cards }).success(function(){
      column.isSyncing = false;
    });
  };

  // removeCardFromColumn is always hit first in
  // a cross-column card drag event
  var colJustRemovedFrom = null;
  this.removeCardFromColumn = function ($col) {
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
      return c.remoteObject.id === id;
    });
    oldDeck.splice(oldIndex, 1);
    newDeck.splice(newIndex, 0, card);
    $http.put(api.route('boards/'+board.attributes._id+'/columns/'+colJustRemovedFrom+'/cards'), { cards: oldDeck }).success(function() {
      column1.isSyncing = false;
    });
    $http.put(api.route('boards/'+board.attributes._id+'/columns/'+$col+'/cards'), { cards: newDeck }).success(function() {
      column2.isSyncing = false;
    });
  };
}]
