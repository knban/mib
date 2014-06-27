var li = require('li');

var providerInfo = {
  name: "github",
  displayName: "GitHub",
  iconUrl: "/images/github_48px.png"
};

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
      info: providerInfo,
      next: function() {
        $http.defaults.headers.common.Authorization = 'token '+app.session.oauth;
        board.projectLinker._Provider = this;
        board.projectLinker._Help = "Is it a personal repository or part of an organization?"
        board.projectLinker._PersonalOrOrg = true;
      },
      personal: function() {
        board.projectLinker._PersonalOrOrg = false;
        this.getRepos(app.session.auth.github.user.repos_url);
      },
      org: function() {
        board.projectLinker._PersonalOrOrg = false;
        board.projectLinker._Help = "Fetching organizations...";
        $http.get(app.session.auth.github.user.organizations_url).success(function(data) {
          board.projectLinker._Help = "Which organization owns the repository from which you wish to import open issues?";
          board.projectLinker._Orgs = data;
        })
      },
      selectOrg: function(org) {
        board.projectLinker._Orgs = false;
        this.getRepos(org.repos_url);
      },
      getReposPrev: function() {
        this.getRepos(board.projectLinker._ReposLinks.prev);
      },
      getReposNext: function() {
        this.getRepos(board.projectLinker._ReposLinks.next);
      },
      getRepos: function(url, pageNum) {
        board.projectLinker._Help = "Fetching repositories...";
        $http.get(url).success(function(data, status, headers, config) {
          board.projectLinker._Help = "Which repository do you wish to import issues from?";
          board.projectLinker._Repos = data;
          board.projectLinker._ReposNext = null;
          board.projectLinker._ReposLast = null;
          board.projectLinker._ReposCurPage = pageNum;
          board.projectLinker._ReposLinks = headers('Link') ? li.parse(headers('Link')) : null;
        })
      },
      importRepo: function(repo) {
        this.importRepoIssues(repo);
        this.installWebhook(repo);
      },
      installWebhook: function(repo) {
        var url = repo.hooks_url;
        // https://developer.github.com/v3/repos/hooks/#create-a-hook
        $http.post(repo.hooks_url, {
          // full list here: https://api.github.com/hooks
          name: "web",
          active: true,
          // more info about events here: https://developer.github.com/webhooks/#events
          events: [
            "issue_comment",
            "issues"
          ],
          config: {
            url: window.location.origin+'/boards/'+board.model.id+'/webhooks/github',
            content_type: "json"
          }
        });
      },
      importRepoIssues: function(repo) {
        repo.imported = true;
        var url = repo.issues_url.replace('{/number}','')+'?state=open';
        this.importIssues(url);
      },
      importIssues: function(url) {
        $http.get(url).success(function(data, status, headers) {
          this.postIssues(data);
          var next = headers('Link') ? li.parse(headers('Link')) : null;
          if (next) {
            this.importIssues(next);
          }
        }.bind(this));
      },
      postIssues: function(openIssues) {
        var importUrl = '/boards/'+board.id+'/columns/'+board.projectLinker._Col+'/cards/import/github';
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
