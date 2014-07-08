module.exports = function (board, $http) {
  var form = this;
  this.open = function() {
    this.users = board.attributes.authorizedUsers;
    this.reset();
    this.isOpen = true;
  }
  this.close = function() {
    this.isOpen = false;
    this.reset();
  }
  this.reset = function () {
    this.newUser = '';
  };
  this.remove = function (user_id) {
    if (confirm("Are you sure?")) {
      api.delete('boards/'+board.attributes._id+'/authorizedUsers/'+user_id)
      .success(function (data) {
        board.attributes.authorizedUsers = data.authorizedUsers;
      }).error(function (err, status) {
        alert(err);
      });
    }
  };
  this.submit = function () {
    if (! this.newUser) return;
    else if (this.users.indexOf(this.newUser) >= 0) return;
    else {
      api.post('boards/'+board.attributes._id+'/authorizedUsers/'+this.newUser)
      .success(function (data) {
        board.attributes.authorizedUsers = data.authorizedUsers;
        form.reset();
      }).error(function (err, status) {
        alert(err);
      });
    }
  };
};
