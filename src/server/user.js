var _ = require('lodash');
var logger = require('winston');

function User(session){
  this.session = session;
  if (session && session.auth) {
    this.auth = session.auth;
    this.loggedIn = true;
    if (this.auth.github) {
      var provider = Object.keys(this.auth)[0];
      var login = this.auth[provider].login;
      this.identifier = provider+":"+login;
    }
  } else {
    this.session = { auth:{} };
    this.loggedIn = false;
  }
};

User.prototype.login = function(authReqFunc, callback) {
  var user = this;
  authReqFunc(function (err, res) {
    if (err) {
      user.loggedIn = false;
      callback(err);
    } else {
      user.session.auth = _.merge(user.session.auth, res.auth);
      user.loggedIn = true;
      callback(null)
    }
  })
};

module.exports = User;
