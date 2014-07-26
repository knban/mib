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
    if (localStorage.lastBoardId) {
      app.loadBoardById(localStorage.lastBoardId);
    }
  };

  if (session.loggedIn) {
    app.loadLastBoard();
  } else {
    var LoginForm = require('../login_form.js');
    var SignupForm = require('../signup_form.js');

    session.loginForm = new LoginForm({
      $http: $http,
      close: function () {
        session.loginForm = null;
      },
      reloadSession: session.load
    });

    session.signupForm = new SignupForm({
      $http: $http
    });
  }
}];
