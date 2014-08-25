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
    var requests = []
    var a = drag.start.column;
    var b = drag.end.column;
    var card = _.find(a.cards, function (c, i) {
      return c._id === drag.id;
    });
    a.isSyncing = b.isSyncing = true;

    if (drag.transfer) {
      drag.el.remove()
      a.cards.splice(drag.start.index, 1);
      b.cards.splice(drag.end.index, 0, card);
      $scope.$digest();
    }

    console.log(_.map(a.cards, function (c) {return c.remoteObject.title}))

    api.put('boards/'+board.attributes._id+'/cards/'+card._id+'/move', {
      old_column: a._id,
      new_column: b._id,
      new_index: drag.end.index
    }).success(function(){
      a.isSyncing = b.isSyncing = false;
    }).error(function (e) {
      console.error(e);
      alert("Error: "+e.message);
    });
  }
}];
