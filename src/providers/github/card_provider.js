var li = require('li');
var async = require('async');
var info = require('./info');
var logger = require('winston');

var _ = {
  map: require('lodash.map'),
  where: require('lodash.where'),
  find: require('lodash.find'),
  flatten: require('lodash.flatten'),
  isEqual: require('lodash.isequal')
}

module.exports = function(boardCtrl, api, github) {
  var board = null;
  var user = null;
  var linker = null; 

  return {
    info: info,
    next: function() {
      linker = boardCtrl.projectLinker;
      board = boardCtrl.attributes;
      linker._Provider = this;
      linker._Help = "Loading user metadata ...";
      github.get('user').success(function(data) {
        user = data;
        linker._Help = "Is it a personal repository or part of an organization?"
        linker._PersonalOrOrg = true;
      })
    },
    personal: function() {
      linker._PersonalOrOrg = false;
      this.repoScope = this.info.displayName+'/'+user.login;
      this.getRepos(user.repos_url);
    },
    org: function() {
      linker._PersonalOrOrg = false;
      linker._Help = "Fetching organizations...";
      github.get(user.organizations_url).success(function(data) {
        linker._Help = "Which organization owns the repository from which you wish to import open issues?";
        linker._Orgs = data;
      })
    },
    selectOrg: function(org) {
      linker._Orgs = false;
      this.getRepos(org.repos_url);
    },
    getReposPrev: function() {
      this.getRepos(linker._ReposLinks.prev);
    },
    getReposNext: function() {
      this.getRepos(linker._ReposLinks.next);
    },
    getRepos: function(url) {
      linker._Help = "Fetching repositories...";
      linker._Repos = [];
      linker.fetchedAllRepos = false;
      this.getMoreRepos(url+"?per_page=100");
    },
    getMoreRepos: function(url) {
      github.get(url).success(function(data, status, headers, config) {
        linker._Repos = linker._Repos.concat(data);
        var next = headers('Link') ? li.parse(headers('Link')).next : null;
        if (next) {
          this.getMoreRepos(next);
        } else {
          linker.fetchedAllRepos = true;
          linker._Help = "Choose one or more repositories to link with the board.";
        }
      }.bind(this))
    },
    importWantedRepos: function() {
      var ids = linker._WantedReposIds;
      var allRepos = linker._Repos;
      var repos = _.map(ids, function (id) {
        return _.where(allRepos, { id: parseInt(id) })[0];
      });

      this.linkRepos(repos, function (err) {
        if (err) {
          throw new Error(err);
        } else {
          linker.close();
        }
      });
    },
    linkRepos: function (repos, callback) {
      var self = this;
      var linkObject = {};
      linkObject[this.info.name] = repos;
      api.put('boards/'+board._id+'/links/'+this.info.name, linkObject).success(function(data) {
        if (data.links) {
          board.links = data.links;
          logger.info("Linked "+repos.length+" repos");
          async.each(repos, function (repo, callback2) {
            logger.info("Importing issues and installing webhook for "+repo.id);
            self.importRepoIssues(repo, function (err) {
              if (err) { callback2(err) } 
              else {
                self.installWebhook(repo, function () {
                  if (err) { callback2(err) } 
                  else { callback2(null) }
                });
              }
            });
          }, function (err) {
            if (err) 
              callback(err);
            else
              callback(null);
          });
        } else {
          callback(new Error("Repo did not link"))
        }
      }).error(function (err) {
        callback(err);
      });
    },
    installWebhook: function(repo, done) {
      // https://developer.github.com/v3/repos/hooks/#create-a-hook
      github.post(repo.hooks_url, {
        // full list here: https://api.github.com/hooks
        name: "web",
        active: true,
        // more info about events here: https://developer.github.com/webhooks/#events
        events: [
          "issue_comment",
          "issues"
        ],
        config: {
          url: api.url('boards/'+board._id+'/github/'+repo.id+'/webhook'),
          content_type: "json"
        }
      }).success(function () {
        done(null)
      }).error(function (err) {
        done(err)
      });
    },
    importRepoIssues: function(repo, done) {
      repo.imported = true;
      var url = repo.issues_url.replace('{/number}','')+'?per_page=100&state=open';
      this.importIssues(url, { repo_id: repo.id }, this.postIssues, done);
    },
    importIssues: function(url, metadata, onSuccess, done) {
      github.get(url).success(function(data, status, headers) {
        onSuccess(data, metadata);
        var next = headers('Link') ? li.parse(headers('Link')).next : null;
        if (next) {
          this.importIssues(next, metadata, onSuccess, done);
        } else {
          done(null);
        }
      }.bind(this)).error(done);
    },
    postIssues: function(openIssues, metadata) {
      api.post('boards/'+board._id+'/cards/github', {
        metadata: metadata,
        openIssues: openIssues
      }).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    },
    canImport: function(repo) {
      return repo.has_issues && repo.open_issues_count > 0;
    },
    refreshCards: function (repo, done) {
      repo.cards = _.flatten(_.map(boardCtrl.attributes.columns, function (col) {
        return _.where(col.cards, { provider: info.name, repo_id: repo.id.toString() });
      }));
      if (repo.cards.length > 1) {
        var cardsToUpdate = [];
        var url = repo.issues_url.replace('{/number}','')+'?per_page=100&state=open';
        this.importIssues(url, { repo_id: repo.id.toString() }, function (issues, metadata) {
          _.map(issues, function (issue) {
            var card = _.find(repo.cards, { remoteObject: { id: issue.id } });
            if (!card) return;
            if ( ! _.isEqual(card.remoteObject.updated_at, issue.updated_at) ) {
              card.remoteObject = issue;
              cardsToUpdate.push(card);
            }
          });
        }, function () {
          if (cardsToUpdate.length > 1) {
            console.info("updating "+cardsToUpdate.length+" cards in "+repo.name);
            api.put('boards/'+boardCtrl.attributes._id+'/cards', {
              cards: cardsToUpdate
            })
          } else {
            console.info("cards in "+repo.name+" are up to date");
          }
          done();
        });
      }
    }
  }
};
