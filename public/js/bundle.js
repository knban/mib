(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (name, definition, context) {

  //try CommonJS, then AMD (require.js), then use global.

  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof context['define'] == 'function' && context['define']['amd']) define(definition);
  else context[name] = definition();

})('li', function () {


  return {
    parse: function (linksHeader) {
      var result = {};
      var entries = linksHeader.split(',');
      // compile regular expressions ahead of time for efficiency
      var relsRegExp = /\brel="?([^"]+)"?\s*;?/;
      var keysRegExp = /(\b[0-9a-z\.-]+\b)/g;
      var sourceRegExp = /^<(.*)>/;

      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i].trim();
        var rels = relsRegExp.exec(entry);
        if (rels) {
          var keys = rels[1].match(keysRegExp);
          var source = sourceRegExp.exec(entry)[1];
          var k, kLength = keys.length;
          for (k = 0; k < kLength; k += 1) {
            result[keys[k]] = source
          }
        }
      }

      return result;
    },
    stringify: function (headerObject, callback) {
      var result = "";
      for (var x in headerObject) {
        result += '<' + headerObject[x] + '>; rel="' + x + '", ';
      }
      result = result.substring(0, result.length - 2);

      return result;
    }
  };

}, this);

},{}],2:[function(require,module,exports){
window.app = angular.module('app', [])
.controller('BoardController', require('./controllers/board_controller'))
.controller('NavigationController', require('./controllers/navigation_controller'))

},{"./controllers/board_controller":3,"./controllers/navigation_controller":4}],3:[function(require,module,exports){
var ProjectLinker = require('../project_linker');

module.exports = ['$http', function($http) {
  this.projectLinker = new ProjectLinker(this, $http);
  this.id = '1';
  this.name = "Empty Board"; 
  this.columns = [];
  var board = this;

  this.restore = function () {
    $http.get('/boards/'+board.id).success(function(data) {
      if (data.board) {
        board.name = data.board.name;
        board.columns = data.board.columns;
      }
    });
  };

  this.setupBoardImportFileField = function () {
    document.getElementsByName('importFileField')[0].onchange = function (e) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = {};
        try {
          data = JSON.parse(reader.result);
          $http.post('/boards/'+board.id+'/import', data)
          .success(board.restore)
          .error(function (err) { throw err });
        } catch (e) {
          console.error(e);
          alert(e);
        }
      };
      reader.readAsText(e.target.files[0]);
    };
  };



  this.removeColumn = function(col) {
    if (confirm("Are you sure you wish to delete this column and all its cards?")) {
      $http.delete('/boards/'+board.id+'/columns/'+col).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
  }
  this.removeCard = function(col, row) {
    if (confirm("Are you sure you wish to delete this card?")) {
      $http.delete('/boards/'+board.id+'/columns/'+col+'/cards/'+row).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
  },
  this.addCard = function(col, body) {
    $http.post('/boards/'+board.id+'/columns/'+col+'/cards', body).success(function(data) {
      if (data.board)
        board.columns[col] = data.board.columns[col];
    });
  }


  this.logCard = function(card) {
    console.log(card);
  }
  this.moveCard = function(direction, col, row) {
    $http.put('/boards/'+board.id+'/columns/'+col+'/cards/'+row+'/move/'+direction).success(function(data) {
      if (data.board)
        board.columns = data.board.columns;
    });
  }
}]

},{"../project_linker":5}],4:[function(require,module,exports){
module.exports = ['$http', function($http) {
  var session = this.session = { loggedIn: false };
  $http.get('/session.json').success(function(data) {
    if (data.auth && data.auth.loggedIn) {
      session.loggedIn = true;
      session.uid = data.uid;
      app.session = data;
    }
  });
}]

},{}],5:[function(require,module,exports){
var GithubProvider = require('../providers/github').cardProvider;

module.exports = function (board, $http) {
  this.providers = [
    GithubProvider(board, $http)
  ];
  this.open = function() {
    this.isOpen = true;
    this._Provider = null;
    this._PersonalOrOrg = null;
    this._Orgs = null;
    this._Repos = null;
    this._ReposCurPage = null;
    this._ReposLinks = null;
    this._Help = "Choose the provider containing the repository from which you wish to import open issues.";
    this._Col = 0;
  }
  this.close = function() {
    this.isOpen = false;
    this._Col = null;
  }
};

},{"../providers/github":6}],6:[function(require,module,exports){
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
            url: window.location.origin+'/boards/'+board.id+'/webhooks/github',
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

},{"li":1}]},{},[2])