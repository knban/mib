module.exports = function(app) {
  app.controller('NavigationController', ['$http', function($http) {
    var session = this.session = { loggedIn: false };
    $http.get('/session.json').success(function(data) {
      if (data.auth && data.auth.loggedIn) {
        session.loggedIn = true;
        session.uid = data.uid;
        app.session = data;
      }
    });
  }]);
}
