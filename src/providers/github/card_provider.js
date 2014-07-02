var li = require('li');
var _ = require('lodash');

module.exports = function (providerInfo) {
  return function(board, $http) {
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
        var allRepos = board.projectLinker._Repos;
        var repos = _.map(ids, function (id) {
          return _.where(allRepos, { id: parseInt(id) })[0];
        });
        _.each(repos, function (repo) {
          try {
            this.linkRepo(repo);
            this.importRepoIssues(repo);
            this.installWebhook(repo);
            board.projectLinker.close();
          } catch (e) {
            alert(e.message);
          }
        }.bind(this))
      },
      linkRepo: function (repo) {
        var url = api.route('boards/'+board.attributes._id+'/links/'+this.info.name+'/'+repo.id);
        $http.put(url, { repo: repo }).success(function(data) {
          if (data.board) board.attributes.links = data.board.links;
        });
      },
      installWebhook: function(repo) {
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
        repo.imported = true;
        var url = repo.issues_url.replace('{/number}','')+'?per_page=100&state=open';
        this.importIssues(url, {
          repo_id: repo.id
        });
      },
      importIssues: function(url, metadata) {
        $http.get(url).success(function(data, status, headers) {
          this.postIssues(data, metadata);
          var next = headers('Link') ? li.parse(headers('Link')).next : null;
          if (next) {
            this.importIssues(next, metadata);
          }
        }.bind(this));
      },
      postIssues: function(openIssues, metadata) {
        var importUrl = api.route('boards/'+board.attributes._id+'/columns/'+board.projectLinker._Col+'/cards/import/github');
        $http.post(importUrl, {
          metadata: metadata,
          openIssues: openIssues
        }).success(function(data) {
          if (data.board)
            board.attributes.columns = data.board.columns;
        });
      },
      canImport: function(repo) {
        return repo.has_issues && repo.open_issues_count > 0;
      }
    }
  }
};
