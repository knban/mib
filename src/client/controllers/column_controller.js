var _ = {
  map: require('lodash.map'),
  find: require('lodash.find'),
  remove: require('lodash.remove'),
  uniq: require('lodash.uniq')
}

var Dropzone = require('../dropzone');

module.exports = ['$scope', function($scope) {
  var board = null;
  var column = null;

  this.init = function (_column, _board) {
    board = _board;
    this.column = column = _column;
    column.$controller = this;
    this.dropzone = new Dropzone(this);
  };

  this.initNewCard = function () {
    this.newCard = {
      isSyncing: true,
      provider: "internal",
      remoteObject: {}
    }
  };

  this.createCard = function () {
    if (!this.newCard.remoteObject.title) return;
    // Turn this into a new card on the UI immediately
    // by splicing it into the cards collection
    var card = null;
    card = this.newCard;
    this.column.cards.push(card);
    this.newCard = null; // controls if the form is displayed
    // Keep a spinner going next to it
    // Fire off an async call
    api.post('columns/' + this.column._id + "/cards", {
      provider: card.provider,
      remoteObject: card.remoteObject
    }).success(function(data) {
      card._id = data.card._id;
      card.isSyncing = false;
    });
  }

  /*
   * Drag and Drop 
   * */
  this.commitDrag = function (drag) {
    // drag object can contain transfer and/or swaps
    // you should always process the transfer first
    // and then process any swaps
    console.log(drag);
    $scope.$apply(function () {
      if (drag.transfer) {
        var a = drag.start.column;
        var b = drag.end.column;
        var card = _.find(a.cards, function (c, i) {
          return c._id === drag.id;
        });
        a.isSyncing = b.isSyncing = true;
        a.cards.splice(drag.start.index, 1);
        drag.el.remove()
        b.cards.splice(drag.end.index, 0, card);
        // ajax request goes here...
        a.isSyncing = b.isSyncing = false;
      }
      if (drag.swaps) {

      }
    })
  }

  function popCard(id, cb) {
    $scope.$apply(function () {
      var res = _.remove(column.cards, function (c, i) {
        return c._id === id;
      });
      if (!res) cb(new Error('Card not found, _id: '+id));
      else cb(null, res[0])
    })
  }

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
    var movedCard = cards.splice(oldIndex, 1);
    cards.splice(newIndex, 0, movedCard[0]);
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
    }).error(function (e) {
      console.error(e);
      alert("Error: "+e.message);
    });
  };
}];
