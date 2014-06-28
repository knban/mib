module.exports = function BoardCreator(board, $http) {
  var form = this;
  this.template = function () {
    return 'views/new_board.html';
  };
  this.toggle = function() {
    this.init();
    this.isOpen = (this.isOpen ? false : true)
    this.boardName = null;
  }
  this.valid = function () {
    return this.boardName && this.boardName.length > 0;
  };
  this.init = function () {
    this.errors = this.success = null;
  };
  this.submit = function () {
    this.init();
    if (this.valid()) {
      $http.post('/boards', { name: this.boardName }).success(function (data) {
        form.errors = null;
        form.success = "Board created!"
        app.updateBoardList();
        app.loadBoard(data.board);
      }).error(function (err, status) {
        form.success = null;
        form.errors = status+" -- "+err;
      });
    } else {
      this.errors = "Name cannot be blank!"
    }
  };
};
