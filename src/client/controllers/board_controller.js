var ProjectLinker = require('../project_linker');
var BoardCreator = require('../board_creator');

module.exports = ['$http', function($http) {
  var board = this;
  this.projectLinker = new ProjectLinker(board, $http);
  //this.id = '1';
  //this.name = "Empty Board"; 
  //this.columns = [];

  this.creator = new BoardCreator(this, $http);

  this.load = app.loadBoard = function (attributes) {
    board.name = attributes.name;
    board.columns = attributes.columns;
  };

  this.loadBoardById = function (_id) {
    $http.get('/boards/'+_id).success(function (data) {
      board.load(data.board)
    });
  };

  this.setupBoardImportFileField = function () {
    document.getElementsByName('importFileField')[0].onchange = function (e) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = {};
        try {
          data = JSON.parse(reader.result);
          $http.post('/boards/'+board.model.id+'/import', data)
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
      $http.delete('/boards/'+board.model.id+'/columns/'+col).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
  }
  this.removeCard = function(col, row) {
    if (confirm("Are you sure you wish to delete this card?")) {
      $http.delete('/boards/'+board.model.id+'/columns/'+col+'/cards/'+row).success(function(data) {
        if (data.board)
          board.columns = data.board.columns;
      });
    }
  },
  this.addCard = function(col, body) {
    $http.post('/boards/'+board.model.id+'/columns/'+col+'/cards', body).success(function(data) {
      if (data.board)
        board.columns[col] = data.board.columns[col];
    });
  }


  this.logCard = function(card) {
    console.log(card);
  }
  this.moveCard = function(direction, col, row) {
    $http.put('/boards/'+board.model.id+'/columns/'+col+'/cards/'+row+'/move/'+direction).success(function(data) {
      if (data.board)
        board.columns = data.board.columns;
    });
  }
}]
