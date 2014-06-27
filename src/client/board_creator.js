module.exports = function BoardCreator(board, $http) {
  this.toggle = function() {
    this.isOpen = (this.isOpen ? false : true)
    this.boardName = null;
  }
  this.valid = function () {
    return this.boardName && this.boardName.length > 0;
  };
  this.submit = function () {
    this.errors = this.success = null;
    if (this.valid()) {
      this.success = "OK"
      //$http.post('/boards', { this.model }).success(function () {
      //  
      //});
    } else {
      this.errors = "Name cannot be blank!"
    }
    console.log(this.boardName);
  };
};
