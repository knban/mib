module.exports = function BoardCreator(board, $http) {
  var form = this;
  this.template = function () {
    return 'views/new_board.html';
  };
  this.open = function () {
    this.boardName = null;
    this.errors = this.success = null;
    board.unload(true);
    this.isOpen = true;
  };
  this.close = function () {
    this.isOpen = false;
    app.loadLastBoard();
  };
  this.valid = function () {
    return this.boardName && this.boardName.length > 0;
  };
  this.submit = function () {
    this.errors = this.success = null;
    if (this.valid()) {
      var payload = { name: this.boardName };
      if (this.jsonImport && this.jsonImport.columns) {
        payload.columns = this.jsonImport.columns;
      }
      $http.post(api.route('boards'), payload).success(function (data) {
        form.errors = null;
        form.success = "Board created!"
        form.close();
        app.loadBoardById(data.board._id);
        app.updateBoardList();
      }).error(function (err, status) {
        form.success = null;
        form.errors = status+" -- "+err;
      });
    } else {
      this.errors = "Name cannot be blank!"
    }
  };
};
