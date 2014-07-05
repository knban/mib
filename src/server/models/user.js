var uuid = require('node-uuid');

var userSchema = require('./../schemata/user');
userSchema.method('login', function(data, providers, callback) {
  var user = this;
  var authorizer = providers[data.provider].authorizer;
  authorizer(data.uid, data.pw)(function (err, res) {
    if (err || !res) {
      callback(new Error("Login Failed"));
    } else {
      user.session = {
        provider: data.provider,
        uid: data.uid
      }
      user.token = uuid.v4();
      user.save(function () {
        callback(null)
      });
    }
  })
});

module.exports = require('mongoose').model('User', userSchema);

