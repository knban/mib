module.exports = function(app) {
  app.controller('NavigationController', ['$http', function($http) {
    var session = this.session = { loggedIn: false };
    $http.get('/session.json').success(function(data) {
      session.loggedIn = data.auth && data.auth.loggedIn;
      session.uid = data.uid;
    });
  }]);
}
