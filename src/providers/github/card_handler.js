var _ = require('lodash');

module.exports = function(providerInfo) {
  return {
    newCard: function (repo_id, issue) {
      return {
        remoteObject: issue,
        provider: providerInfo.name,
        repo_id: repo_id
      }
    },
    batchImport: function(boardAttributes, issues, metadata, done) {
      var cards = boardAttributes.columns[0].cards;
      var allCards = _.flatten(_.pluck(boardAttributes.columns, 'cards'));
      // Sort the cards by provider_id so testing dupes is quicker (Right?)
      var sortedCards = _.sortBy(allCards, function(c) { return c.provider_id });
      _.each(issues, function(issue) {
        // Determine if we already represent this issue with a card
        var existingCard = _.find(sortedCards, function(card) {
          return card.remoteObject.id === issue.id
        });
        if (existingCard) {
          _.merge(existingCard.remoteObject, issue);
        } else {
          var card = this.newCard(metadata.repo_id, issue);
          cards.push(card);
        }
      }.bind(this));
      done();
    }
  }
}
