module.exports = ['$http', function($http) {
  session = this;

  $http.get(api.route('/session')).success(function(data) {
    if (data.session.auth.github) {
      this.attributes = data.session;

      if (data.session.auth) {
        session.anonymous = false;
        session.loggedIn = true;
        session.uid = data.session.auth.github.login;
        session.getBoardList();
      } else
        session.destroy()
    }
  }).error(session.destroy);

  this.destroy = function () {
    session.anonymous = true;
    session.loggedIn = false;
    app.session = null;
  };

  this.getBoardList = app.updateBoardList = function () {
    $http.get(api.route('boards/index')).success(function(data) {
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

  this.showLogin = function () {
    
  };

  var LoginForm = require('../login_form.js');

  this.login = function () {
    if (this.loginForm) {
    } else {
      session.loginForm = new LoginForm({
        $http: $http,
        close: function () {
          session.loginForm = null;
        }
      });
    }
  };
}];
