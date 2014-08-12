var uuid = require('node-uuid');
var logger = require('winston');

var userSchema = require('./../schemata/user');

/* 
 * A user will login with local credentials (provider=local)
 * or with 3rd party credentials (provider=github) in either case
 * we want to findOrCreate a User and grant a fresh token. */
userSchema.statics.findOrCreateByAuthorization = function(data, providers, callback) {
  var authorizer = providers[data.provider].authorizer;
  authorizer(data.uid, data.pw)(function (err, providerData) {
    if (err) {
      callback(new Error("Login Failed"));
    } else {
      if (data.provider === 'local') {
        var user = providerData.user;
        user.token = uuid.v4();
        user.save(function () {
          callback(null, user, providerData)
        });
      } else {
        this.findOne()
        .where('authorizations.'+data.provider+'.login')
        .equals(providerData.login)
        .exec(function (err, user) {
          if (err) { return callback(err); }
          else if (user) {
            // Found the user
            var auths = user.authorizations || {};
            auths[data.provider] = providerData;
            user.authorizations = null; // important
            user.authorizations = auths;
            user.token = uuid.v4();
            user.save(function (err, savedUser) {
              if (err) callback(err);
              else callback(null, savedUser, providerData)
            });
          } else {
            // Create the user
            var user = new User();
            var auths = {};
            auths[data.provider] = providerData;
            user.authorizations = auths;
            user.token = uuid.v4();
            user.save(function (err, res) {
              if (err) callback(err);
              else callback(null, user, providerData)
            });
          }
        })
      }
    }
  }.bind(this))
};

var User = require('mongoose').model('User', userSchema);

module.exports = User;

