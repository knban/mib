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
    this.column.cards.push(this.newCard);
    this.newCard = null;
    // Keep a spinner going next to it
    // Fire off an async call
  }
}];
