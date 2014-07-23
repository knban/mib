var logger = require('winston');

module.exports = ['$http', function($http) {
  session = this;

  var configureEndpoint = function () {
    api.setClient('angular', $http, {
      headers: {
        'X-Auth-Token': localStorage.token
      }
    });
  };

  configureEndpoint();

  this.load = function () {
    configureEndpoint();
    api.get('session').success(function(data) {
      session.user = data;
      try {
        localStorage.github = data.authorizations.github.token;
      } catch (e) {
        logger.warn("no github authorization");
        localStorage.removeItem('github');
      }
      session.loggedIn = true;
      session.getBoardList();
    }).error(function () {
      session.destroy();
    });
  };

  if (localStorage.token) {
    this.load();
  }

  this.destroy = function () {
    localStorage.clear();
    session.loggedIn = false;
    session.user = null;
  };

  this.getBoardList = app.updateBoardList = function () {
    api.get('boards').success(function(data) {
      session.boards = data.boards;
    })
  };

  app.loadLastBoard = function () {
    app.loadBoardById(localStorage.lastBoardId);
  };

  if (localStorage.lastBoardId) {
    app.loadLastBoard();
  }

  var LoginForm = require('../login_form.js');

  this.login = function () {
    if (this.loginForm) {
    } else {
      session.loginForm = new LoginForm({
        $parent: this,
        $http: $http,
        close: function () {
          session.loginForm = null;
        },
        reloadSession: session.load
      });
    }
  };
}];
