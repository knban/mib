var li = require('li');
var _ = require('lodash');

var providerInfo = {
  name: "github",
  displayName: "GitHub",
  iconUrl: "/images/github_48px.png"
};

module.exports = {
  cardHandler: function() {
    return {
      batchImport: function(boardAttributes, issues, done) {
        var cards = boardAttributes.columns[0].cards;
        var allCards = _.flatten(_.pluck(boardAttributes.columns, 'cards'));
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
        var user = app.session.auth.github.user;
        this.repoScope = this.info.displayName+'/'+user.login;
        this.getRepos(user.repos_url);
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
      getRepos: function(url) {
        board.projectLinker._Help = "Fetching repositories...";
        board.projectLinker._Repos = [];
        board.projectLinker.fetchedAllRepos = false;
        this.getMoreRepos(url+"?per_page=100");
      },
      getMoreRepos: function(url) {
        $http.get(url).success(function(data, status, headers, config) {
          board.projectLinker._Repos = board.projectLinker._Repos.concat(data);
          var next = headers('Link') ? li.parse(headers('Link')).next : null;
          if (next) {
            this.getMoreRepos(next);
          } else {
            board.projectLinker.fetchedAllRepos = true;
            board.projectLinker._Help = "Choose one or more repositories to link with the board.";
          }
        }.bind(this))
      },
      importWantedRepos: function() {
        var ids = board.projectLinker._WantedReposIds;
        console.log(ids);
        var allRepos = board.projectLinker._Repos;
        var repos = _.map(ids, function (id) {
          console.log(id);
          return _.where(allRepos, { id: parseInt(id) })[0];
        });
//        var repos = _.filter(allRepos, function(r) { return _.contains(parseInt(ids), parseInt(r.id)) })
        console.log(repos);
        _.each(repos, function (repo) {
          this.linkRepo(repo);
          this.importRepoIssues(repo);
          this.installWebhook(repo);
        }.bind(this))
      },
      linkRepo: function (repo) {
        var url = '/boards/'+board.attributes._id+'/links/'+this.info.name+'/'+repo.id;
        $http.put(url, { repo: repo }).success(function(data) {
          if (data.board) board.attributes.links = data.board.links;
        });
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
            url: window.location.origin+'/boards/'+board.attributes._id+'/webhooks/github',
            content_type: "json"
          }
        });
      },
      importRepoIssues: function(repo) {
        console.log(repo);
        repo.imported = true;
        var url = repo.issues_url.replace('{/number}','')+'?per_page=100&state=open';
        this.importIssues(url);
      },
      importIssues: function(url) {
        $http.get(url).success(function(data, status, headers) {
          this.postIssues(data);
          var next = headers('Link') ? li.parse(headers('Link')).next : null;
          if (next) {
            this.importIssues(next);
          }
        }.bind(this));
      },
      postIssues: function(openIssues) {
        var importUrl = '/boards/'+board.attributes._id+'/columns/'+board.projectLinker._Col+'/cards/import/github';
        $http.post(importUrl, { openIssues: openIssues }).success(function(data) {
          if (data.board)
            board.attributes.columns = data.board.columns;
        });
      },
      canImport: function(repo) {
        return repo.has_issues && repo.open_issues_count > 0;
      }
    }
  }
}
