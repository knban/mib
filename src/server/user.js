function User(session){
  this.session = session;
  if (session && session.auth) {
    this.auth = session.auth;
    this.loggedIn = this.auth.loggedIn;
    if (this.loggedIn) {
      var provider = Object.keys(this.auth)[0];
      var id = this.auth[provider].user.id;
      var login = this.auth[provider].user.login;
      this.identifier = provider+":"+login;
    }
  } else {
    this.loggedIn = false;
  }
};

User.prototype.login = function(authReqFunc, callback) {
  var user = this;
  authReqFunc(function (err, res) {
    console.log(err, res);
    if (err) {
      user.loggedIn = false;
      callback(err);
    } else {
      callback(null);
    }
    /*
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      console.log(info.stargazers_count + " Stars");
      console.log(info.forks_count + " Forks");
    }
    */
  })
};

module.exports = User;
