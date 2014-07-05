var bcrypt = require('bcrypt');
var User = require('mongoose').model('User');

module.exports = function (uid, pw) {
  return function (callback) {
    User.findOne({ uid: uid }).exec(function (err, user) {
      if (err) { callback(err) }
      else if (user) {
        bcrypt.compare(pw, user.hash, function (err, res) {
          if (res) {
            callback(null, { user: user });
          } else {
            callback(new Error("Failed to Auth"));
          }
        })
      } else {
        callback(new Error("Failed to Auth"));
      }
    });
  };
}
