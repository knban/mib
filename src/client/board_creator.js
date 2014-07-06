module.exports = function BoardCreator(board, $http) {
  var form = this;
  this.template = function () {
    return 'views/new_board.html';
  };
  this.reset = function () {
    this.jsonImport = null;
    this.boardName = null;
    this.submitted = null;
    this.errors = this.success = null;
  };
  this.open = function () {
    this.reset();
    board.unload(true);
    this.isOpen = true;
  };
  this.close = function () {
    this.isOpen = false;
    if (! this.submitted)
      app.loadLastBoard();
    this.reset();
  };
  this.valid = function () {
    return this.boardName && this.boardName.length > 0;
  };
  this.submit = function () {
    this.submitted = true;
    this.errors = this.success = null;
    if (this.valid()) {
      var payload = { name: this.boardName };
      if (this.jsonImport) payload.jsonImport = this.jsonImport;
      $http.post(api.route('boards'), payload).success(function (data) {
        form.success = "Board created!"
        form.close();
        app.loadBoardById(data.board._id);
        app.updateBoardList();
      }).error(function (err, status) {
        form.errors = status+" -- "+err;
      });
    } else {
      this.errors = "Name cannot be blank!"
    }
  };
};
