function User(session){
  this.auth = session.auth;
  this.loggedIn = this.auth.loggedIn;
  if (this.loggedIn) {
    var provider = Object.keys(this.auth)[0];
    var id = this.auth[provider].user.id;
    var login = this.auth[provider].user.login;
    this.identifier = provider+":"+login;
  }
}

module.exports = User;
