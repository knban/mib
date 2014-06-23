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
    this.removeCard = function(row, col) {
      $http.delete('/boards/1/cards/'+row+'/'+col).success(function(data) {
        console.log(data);
        if (data.board)
          board.columns = data.board.columns;
      });
    }
  }]);
}
