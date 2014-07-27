var logger = require('winston');
var LoginForm = require('../login_form.js');
var SignupForm = require('../signup_form.js');

module.exports = ['$http', function($http) {
  session = this;
  session.loginForm = new LoginForm(this);
  session.signupForm = new SignupForm(this);

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
      app.loadLastBoard();
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
}];
