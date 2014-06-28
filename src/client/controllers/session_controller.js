module.exports = ['$http', function($http) {
  session = this;
  $http.get('/session.json').success(function(data) {
    if (data.auth && data.auth.loggedIn) {
      session.loggedIn = true;
      session.uid = data.uid;
      session.data = data;
      session.getBoardList();
    } else
      session.notLoggedIn = true;
  }).error(function () {
    session.notLoggedIn = true;
  });

  this.getBoardList = app.updateBoardList = function () {
    $http.get('/boards/index').success(function(data) {
      session.boards = data.boards;
    })
  };
}];
