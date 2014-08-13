var User = require('../../models').User
  , providers = require('../../../providers')

module.exports = function createSession(req, res, next) {
  User.findOrCreateByAuthorization(req.body, providers, function (err, user, providerData) {
    if (err) {
      res.status(401).send('invalid credentials');
    } else {
      res.status(201).send({
        token: user.token,
        _id: user._id,
        provider: providerData
      });
    }
  });
}
