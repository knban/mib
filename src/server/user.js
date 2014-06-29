module.exports = require('backbone').Model.extend({
  initialize: function () {
    this.auth = this.get('auth');
    this.loggedIn = this.auth.loggedIn;
    if (this.loggedIn) {
      this.identifier = this.computeIdentifier();
    }
  },

  computeIdentifier: function () {
    var provider = Object.keys(this.auth)[0];
    var id = this.auth[provider].user.id;
    var login = this.auth[provider].user.login;
    return provider+":"+login;
  }
})
