var GithubProvider = require('../../providers/github');

module.exports = ['$http', function($http) {
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
    if (confirm("Are you sure you wish to delete this column and all its cards?")) {
      $http.delete('/boards/'+board.id+'/columns/'+col).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
  }
  this.removeCard = function(col, row) {
    if (confirm("Are you sure you wish to delete this card?")) {
      $http.delete('/boards/'+board.id+'/columns/'+col+'/cards/'+row).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
  },
  this.addCard = function(col, body) {
    $http.post('/boards/'+board.id+'/columns/'+col+'/cards', body).success(function(data) {
      if (data.board)
        board.columns[col] = data.board.columns[col];
    });
  }
  this.availableImportProviders = [
    GithubProvider(board, $http)
  ];
  this.importCards = function(col) {
    board.importing = true;
    board.importProvider = null;
    board.importPersonalOrOrg = null;
    board.importOrgs = null;
    board.importRepos = null;
    board.importHelp = "Choose the provider containing the repository from which you wish to import open issues.";
    board.importCol = col;
  }
  this.closeImport = function() {
    board.importing = null;
    board.importCol = null;
  }
  this.focusColumn = function(col) {
    if (board.showOnly === col) {
      board.showOnly = null;
      board.focusMode = false;
    } else {
      board.showOnly = col;
      board.focusMode = true;
    }
  }
  this.unfocused = function(col) {
    return board.focusMode && board.showOnly !== col;
  }
  this.logCard = function(card) {
    console.log(card);
  }
  this.moveCardRight = function(col, row) {
    $http.put('/boards/'+board.id+'/columns/'+col+'/cards/'+row+'/move', {
      direction: 'right'
    }).success(function(data) {
      if (data.board)
        board.columns = data.board.columns;
    });
  }
}]
