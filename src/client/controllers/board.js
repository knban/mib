module.exports = function(app) {
  app.controller('BoardController', ['$http', function($http) {
    this.name = "Empty Board"; 
    this.columns = [];
    var board = this;
    $http.get('/boards/1').success(function(data) {
      if (data.board) {
        board.name = data.board.name;
        board.columns = data.board.columns;
      }
    });
    this.removeColumn = function(col) {
      $http.delete('/boards/1/columns/'+col).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
    this.removeCard = function(col, row) {
      $http.delete('/boards/1/columns/'+col+'/cards/'+row).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
  }]);
}
