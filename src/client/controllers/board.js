module.exports = function(app) {
  app.controller('BoardController', ['$http', function($http) {
    this.id = '1';
    this.name = "Empty Board"; 
    this.columns = [];
    var board = this;
    $http.get('/boards/'+board.id).success(function(data) {
      if (data.board) {
        board.name = data.board.name;
        board.columns = data.board.columns;
      }
    });
    this.removeColumn = function(col) {
      $http.delete('/boards/'+board.id+'/columns/'+col).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
    this.removeCard = function(col, row) {
      $http.delete('/boards/'+board.id+'/columns/'+col+'/cards/'+row).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
    this.importCards = function(col) {
      var repos_url = app.session.auth.github.user.repos_url;
      $http.get(repos_url).success(function(data) {
        console.log(data);
      })
    }
  }]);
}
