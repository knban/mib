module.exports = function(app) {
  app.controller('BoardController', ['$http', function($http) {
    this.name = "Empty Board"; 
    this.columns = [];
    var board = this;
    $http.get('/board/1').success(function(data) {
      board.name = data.board.name;
      board.columns = data.board.columns;
    });
  }]);
}
