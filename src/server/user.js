module.exports = require('backbone').Model.extend({
  initialize: function () {
    auth = this.get('auth');
    this.loggedIn = auth.loggedIn;
    if (this.loggedIn) {
      this.identifier = this.computeIdentifier();
    }
  },

  computeIdentifier: function () {
    var provider = Object.keys(auth)[0];
    var id = auth[provider].user.id;
    var login = auth[provider].user.login;
    return provider+":"+id+":"+login;
  }
})

var auth = null;
