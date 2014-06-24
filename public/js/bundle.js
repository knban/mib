(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = angular.module('app', [])
.controller('BoardController', require('./controllers/board'))
.controller('NavigationController', require('./controllers/nav'))

},{"./controllers/board":2,"./controllers/nav":3}],2:[function(require,module,exports){
var GithubProvider = require('../../providers/github');

module.exports = ['$http', function($http) {
  this.id = '1';
  this.name = "Empty Board"; 
  this.columns = [];
  var board = this;
  $http.get('/boards/'+board.id).success(function(data) {
    if (data.board) {
      board.name = data.board.name;
      board.columns = data.board.columns;
    }
  });
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
  this.availableImportProviders = [
    GithubProvider(board, $http)
  ];
  this.startImport = function() {
    board.importing = true;
    board.importProvider = null;
    board.importPersonalOrOrg = null;
    board.importOrgs = null;
    board.importRepos = null;
    board.importHelp = "Choose the provider containing the repository from which you wish to import open issues.";
    board.importCol = 0;
  }
  this.closeImport = function() {
    board.importing = null;
    board.importCol = null;
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

},{"../../providers/github":5}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
window.app = require('./app');


},{"./app":1}],5:[function(require,module,exports){
module.exports = function(board, $http) {
  return  {
    name: "GitHub",
    next: function() {
      board.importProvider = this;
      board.importHelp = "Is it a personal repository or part of an organization?"
      board.importPersonalOrOrg = true;
    },
    personal: function() {
      board.importPersonalOrOrg = false;
      this.getRepos(app.session.auth.github.user.repos_url, 1);
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
      this.getRepos(org.repos_url, 1);
    },
    getRepos: function(url, pageNum) {
      board.importHelp = "Fetching repositories...";
      $http.get(url+'?page='+pageNum).success(function(data) {
        board.importHelp = "Which repository do you wish to import issues from?";
        board.importRepos = data;
      })
    },
    importRepoIssues: function(repo) {
      repo.imported = true;
      var importUrl = '/boards/'+board.id+'/columns/'+board.importCol+'/cards/import/github';
      $http.get(repo.issues_url.replace('{/number}','')+'?state=open').success(function(data) {
        console.log(data);
        $http.post(importUrl, { openIssues: data }).success(function(data) {
          if (data.board)
            board.columns = data.board.columns;
        });
      });
    },
    canImport: function(repo) {
      return repo.has_issues && repo.open_issues_count > 0;
    }
  }
}

},{}]},{},[4])