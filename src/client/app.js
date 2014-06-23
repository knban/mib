var app = angular.module('app', []);

app.controller('SessionController', ['$http', function($http) {
  this.loggedIn = false;
  var session = this;
  $http.get('/session.json').success(function(data) {
    console.log(data);
    session.loggedIn = data.auth && data.auth.loggedIn;
  });
}]);

app.controller('BoardController', function() {
  this.name = "MyBoard"; 
});

module.exports = app;
