var _ = require('lodash');

module.exports = function (board, $http) {
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
  };
  this.submit = function () {
    if (! this.newUser) return;
    else if (board.attributes.authorizedUsers.indexOf(this.newUser) >= 0)
      return;
    else if (this.newUser.indexOf(':') === -1)
      return alert("Please use format 'provider:username'");
    else {
      var users = _.uniq(this.users.concat(this.newUser));
      var payload = { authorizedUsers: users };
      var url = api.route('boards/'+board.attributes._id+'/users');
      $http.put(url, payload).success(function (data) {
        board.attributes.authorizedUsers = data.authorizedUsers;
      }).error(function (err, status) {
        alert(err);
      });
    }
  };
};
