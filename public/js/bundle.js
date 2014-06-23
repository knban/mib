(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = window.app = angular.module('app', []);
require('./controllers/nav')(app);
require('./controllers/board')(app);
module.exports = app;

},{"./controllers/board":2,"./controllers/nav":3}],2:[function(require,module,exports){
module.exports = function(app) {
  app.controller('BoardController', ['$http', function($http) {
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
      $http.delete('/boards/'+board.id+'/columns/'+col).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
    this.removeCard = function(col, row) {
      $http.delete('/boards/'+board.id+'/columns/'+col+'/cards/'+row).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
    this.importCards = function(col) {
      var repos_url = app.session.auth.github.user.repos_url;
      $http.get(repos_url).success(function(data) {
        console.log(data);
      })
    }
  }]);
}

},{}],3:[function(require,module,exports){
module.exports = function(app) {
  app.controller('NavigationController', ['$http', function($http) {
    var session = this.session = { loggedIn: false };
    $http.get('/session.json').success(function(data) {
      if (data.auth && data.auth.loggedIn) {
        session.loggedIn = true;
        session.uid = data.uid;
        app.session = data;
      }
    });
  }]);
}

},{}],4:[function(require,module,exports){
var app = require('./app');


},{"./app":1}]},{},[4])