module.exports = ['$http', function($http) {
  session = this;
  $http.get('/session.json').success(function(data) {
    if (data.auth && data.auth.loggedIn) {
      session.loggedIn = true;
      session.uid = data.uid;
      session.data = data;
    } else
      session.notLoggedIn = true;
  }).error(function () {
    session.notLoggedIn = true;
  });
}];
