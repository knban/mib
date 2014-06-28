var ProjectLinker = require('../project_linker');
var BoardCreator = require('../board_creator');

module.exports = ['$http', function($http) {
  var board = this;
  this.projectLinker = new ProjectLinker(board, $http);
  this.creator = new BoardCreator(this, $http);
  this.unload = function () {
    board.loaded = false;
    board.attributes = null;
    this.projectLinker.close();
    localStorage.removeItem('lastBoardId')
  };
  this.load = app.loadBoard = function (attributes) {
    board.attributes = attributes;
    board.loaded = true;
    localStorage.lastBoardId = attributes._id;
  };
  this.loadBoardById = app.loadBoardById = function (_id) {
    board.loaded = false;
    $http.get('/boards/'+_id).success(function (data) {
      board.load(data.board)
    }).error(function () {
      localStorage.removeItem('lastBoardId')
    });
  };
  this.setupBoardImportFileField = function () {
    document.getElementsByName('importFileField')[0].onchange = function (e) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = {};
        try {
          data = JSON.parse(reader.result);
          $http.post('/boards/'+board.attributes._id+'/import', data)
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
      $http.delete('/boards/'+board.attributes._id+'/columns/'+col).success(function(data) {
        if (data.board)
          board.attributes.columns = data.board.attributes.columns;
      });
    }
  }
  this.removeCard = function(col, row) {
    if (confirm("Are you sure you wish to delete this card?")) {
      $http.delete('/boards/'+board.attributes._id+'/columns/'+col+'/cards/'+row).success(function(data) {
        if (data.board)
          board.attributes.columns = data.board.attributes.columns;
      });
    }
  },
  this.addCard = function(col, body) {
    $http.post('/boards/'+board.attributes._id+'/columns/'+col+'/cards', body).success(function(data) {
      if (data.board)
        board.attributes.columns[col] = data.board.attributes.columns[col];
    });
  }


  this.logCard = function(card) {
    console.log(card);
  }

  this.moveCard = function(direction, col, row) {
    $http.put('/boards/'+board.attributes._id+'/columns/'+col+'/cards/'+row+'/move/'+direction).success(function(data) {
      if (data.board)
        board.attributes.columns = data.board.attributes.columns;
    });
  }

  this.deleteBoard = function () {
    if (confirm("Are you sure you wish to delete this board and all its cards? Make sure to backup using the export tool!")) {
      $http.delete('/boards/'+board.attributes._id).success(function() {
        board.unload();
        app.updateBoardList();
      });
    }
  };
}]
