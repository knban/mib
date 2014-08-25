var _ = {
  map: require('lodash.map'),
  find: require('lodash.find'),
  remove: require('lodash.remove'),
  uniq: require('lodash.uniq')
}

module.exports = ['$scope', function($scope) {
  var board = null;
  var column = null;

  this.init = function (_column, _board) {
    board = _board;
    this.column = column = _column;
    column.$controller = this;
  };

  this.initNewCard = function () {
    this.newCard = {
      isSyncing: true,
      provider: "local",
      remoteObject: {}
    }
  };

  this.createCard = function () {
    if (!this.newCard.remoteObject.title) return;
    // Turn this into a new card on the UI immediately
    // by splicing it into the cards collection
    var card = null;
    card = this.newCard;
    this.column.cards.splice(0, 0, card);
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
    function swapArrayElements(array_object, index_a, index_b) {
      var temp = array_object[index_a];
      array_object[index_a] = array_object[index_b];
      array_object[index_b] = temp;
    }
    var a = drag.start.column;
    var b = drag.end.column;
    var card = _.find(a.cards, function (c, i) {
      return c._id === drag.id;
    });
    a.isSyncing = b.isSyncing = true;

    if (drag.transfer) {
      a.cards.splice(drag.start.index, 1);
      b.cards.push(card);
      if (drag.swaps) {
        startIndex = b.cards.length-1;
        endIndex = drag.end.index;
        swapArrayElements(b.cards, startIndex, endIndex);
      }
    } else if (drag.swaps) {
      startIndex = drag.start.index;
      endIndex = drag.end.index;
      swapArrayElements(b.cards, startIndex, endIndex);
    }

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
