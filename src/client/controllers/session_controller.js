module.exports = ['$http', function($http) {
  session = this;
  $http.get('/session.json').success(function(data) {
    if (data.auth && data.auth.loggedIn) {
      session.loggedIn = true;
      session.uid = data.uid;
      session.data = app.session = data;
      session.getBoardList();
    } else
      session.over()
  }).error(session.over);

  this.over = function () {
    session.notLoggedIn = true;
    session.loggedIn = false;
    app.session = null;
  };

  this.getBoardList = app.updateBoardList = function () {
    $http.get('/boards/index').success(function(data) {
      session.boards = data.boards;
    })
  };
}];