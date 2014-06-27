var GithubProvider = require('../../providers/github').cardProvider;

module.exports = ['$http', function($http) {
  this.id = '1';
  this.name = "Empty Board"; 
  this.columns = [];
  var board = this;

  this.restore = function () {
    $http.get('/boards/'+board.id).success(function(data) {
      if (data.board) {
        board.name = data.board.name;
        board.columns = data.board.columns;
      }
    });
  };

  this.setupBoardImportFileField = function () {
    document.getElementsByName('importFileField')[0].onchange = function (e) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = {};
        try {
          data = JSON.parse(reader.result);
          $http.post('/boards/'+board.id+'/import', data)
          .success(board.restore)
          .error(function (err) { throw err });
        } catch (e) {
          console.error(e);
          alert(e);
        }
      };
      reader.readAsText(e.target.files[0]);
    };
  };



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
  this.startImport = function() {
    board.importing = true;
    board.importProvider = null;
    board.importPersonalOrOrg = null;
    board.importOrgs = null;
    board.importRepos = null;
    board.importReposCurPage = null;
    board.importReposLinks = null;
    board.importHelp = "Choose the provider containing the repository from which you wish to import open issues.";
    board.importCol = 0;
  }
  this.closeImport = function() {
    board.importing = null;
    board.importCol = null;
  }
  this.logCard = function(card) {
    console.log(card);
  }
  this.moveCard = function(direction, col, row) {
    $http.put('/boards/'+board.id+'/columns/'+col+'/cards/'+row+'/move/'+direction).success(function(data) {
      if (data.board)
        board.columns = data.board.columns;
    });
  }
}]
