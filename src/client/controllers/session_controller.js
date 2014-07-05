module.exports = ['$http', function($http) {
  session = this;

  this.userIdentifier = function () {
    return this.user.uid || this.user.authorizations.github.login;
  };

  this.load = function () {
    $http.defaults.headers.common['X-Auth-Token'] = localStorage.token;
    $http.get(api.route('session')).success(function(data) {
      session.user = data;
      session.anonymous = false;
      session.loggedIn = true;
      session.getBoardList();
    }).error(session.destroy);
  };

  if (localStorage.token) {
    this.load();
  }

  this.destroy = function () {
    $http.delete(api.route('session'));
    localStorage.removeItem('token');
    session.anonymous = true;
    session.loggedIn = false;
    app.session = null;
  };

  this.getBoardList = app.updateBoardList = function () {
    $http.get(api.route('boards/')).success(function(data) {
      session.boards = data.boards;
    })
  };

  app.loadLastBoard = function () {
    app.loadBoardById(localStorage.lastBoardId);
  };

  if (localStorage.lastBoardId) {
    app.loadLastBoard();
  }

  if (window.ionic) {
    this.ionic = {
      login: function() {
      }
    }
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
