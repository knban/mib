var _ = require('lodash');
var info = require('./info');

module.exports = {
  newCard: function (repo_id, issue) {
    return {
      remoteObject: issue,
      provider: info.name,
      repo_id: repo_id
    }
  },
  batchImport: function(board, json, importCard, done) {
    var issues = json.openIssues;
    var metadata = json.metadata;
    var cards = board.columns[0].cards;
    var allCards = _.flatten(_.pluck(board.columns, 'cards'));
    // Sort the cards by provider_id so testing dupes is quicker (Right?)
    var sortedCards = _.sortBy(allCards, function(c) { return c.provider_id });
    _.each(issues, function(issue) {
      // Determine if we already represent this issue with a card
      var existingCard = _.find(sortedCards, function(card) {
        return card.remoteObject.id === issue.id
      });
      if (! existingCard) {
        importCard(this.newCard(metadata.repo_id, issue));
      }
    }.bind(this));
    done();
  }
}
