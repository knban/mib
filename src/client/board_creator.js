module.exports = function BoardCreator(board, $http) {
  var form = this;
  this.init = function () {
    board.unload(true);
    this.errors = this.success = null;
  };
  this.template = function () {
    return 'views/new_board.html';
  };
  this.toggle = function() {
    this.init();
    this.isOpen = (this.isOpen ? false : true)
    this.boardName = null;
  }
  this.close = function () {
    this.toggle();
    app.loadLastBoard();
  };
  this.valid = function () {
    return this.boardName && this.boardName.length > 0;
  };
  this.submit = function () {
    this.init();
    if (this.valid()) {
      var payload = { name: this.boardName };
      if (this.jsonImport && this.jsonImport.columns) {
        payload.columns = this.jsonImport.columns;
      }
      $http.post(api.route('boards', payload)).success(function (data) {
        form.errors = null;
        form.success = "Board created!"
        app.updateBoardList();
        app.loadBoardById(data.board._id);
      }).error(function (err, status) {
        form.success = null;
        form.errors = status+" -- "+err;
      });
    } else {
      this.errors = "Name cannot be blank!"
    }
  };
};
