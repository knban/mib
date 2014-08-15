module.exports = [function() {
  this.init = function (column) {
    this.column = column;
    column.$controller = this;
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
}];
