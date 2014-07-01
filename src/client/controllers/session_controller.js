module.exports = ['$http', function($http) {
  session = this;

  $http.get(api.route('/session.json')).success(function(data) {
    if (data.auth && data.auth.loggedIn) {
      session.anonymous = false;
      session.loggedIn = true;
      session.uid = data.uid;
      session.data = app.session = data;
      session.getBoardList();
    } else
      session.destroy()
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
        //$http.get('https://api.github.comauth/github').success(function (data, header) {
        //  console.log(arguments);
        //})
      }
    }
  }
}];
