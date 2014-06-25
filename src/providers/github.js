var li = require('li');

module.exports = {
  // Inject the lodash dependency in this way to avoid bringing it in on the browser
  cardHandler: function(_) {
    return {
      batchImport: function(board, issues, done) {
        var cards = board.columns[0].cards;
        var allCards = _.flatten(_.pluck(board.columns, 'cards'));
        // Sort the cards by provider_id so testing dupes is quicker (Right?)
        var sortedCards = _.sortBy(allCards, function(c) { return c.provider_id });
        _.each(issues, function(issue) {
          // Determine if we already represent this issue with a card
          var existingIssueCard = _.find(sortedCards, function(c) {
            return c.id === issue.id
          });
          if (existingIssueCard) {
            _.merge(existingIssueCard, issue);
          } else {
            cards.push(issue);
          }
        });
        done();
      }
    }
  },
  cardProvider: function(board, $http) {
    return  {
      name: "github",
      next: function() {
        $http.defaults.headers.common.Authorization = 'token '+app.session.oauth;
        board.importProvider = this;
        board.importHelp = "Is it a personal repository or part of an organization?"
        board.importPersonalOrOrg = true;
      },
      personal: function() {
        board.importPersonalOrOrg = false;
        this.getRepos(app.session.auth.github.user.repos_url);
      },
      org: function() {
        board.importPersonalOrOrg = false;
        board.importHelp = "Fetching organizations...";
        $http.get(app.session.auth.github.user.organizations_url).success(function(data) {
          board.importHelp = "Which organization owns the repository from which you wish to import open issues?";
          board.importOrgs = data;
        })
      },
      selectOrg: function(org) {
        board.importOrgs = false;
        this.getRepos(org.repos_url);
      },
      getReposPrev: function() {
        this.getRepos(board.importReposLinks.prev);
      },
      getReposNext: function() {
        this.getRepos(board.importReposLinks.next);
      },
      getRepos: function(url, pageNum) {
        board.importHelp = "Fetching repositories...";
        $http.get(url).success(function(data, status, headers, config) {
          board.importHelp = "Which repository do you wish to import issues from?";
          board.importRepos = data;
          board.importReposNext = null;
          board.importReposLast = null;
          board.importReposCurPage = pageNum;
          board.importReposLinks = headers('Link') ? li.parse(headers('Link')) : null;
        })
      },
      importRepoIssues: function(repo) {
        repo.imported = true;
        var url = repo.issues_url.replace('{/number}','')+'?state=open';
        this.importIssues(url);
      },
      importIssues: function(url) {
        $http.get(url).success(function(data, status, headers) {
          this.postIssues(data);
          var next = headers('Link').next;
          if (next)
            this.importIssues(openIssues, next);
        }.bind(this));
      },
      postIssues: function(openIssues) {
        var importUrl = '/boards/'+board.id+'/columns/'+board.importCol+'/cards/import/github';
        $http.post(importUrl, { openIssues: openIssues }).success(function(data) {
          if (data.board)
            board.columns = data.board.columns;
        });
      },
      canImport: function(repo) {
        return repo.has_issues && repo.open_issues_count > 0;
      }
    }
  }
}
