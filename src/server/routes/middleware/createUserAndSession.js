var User = require('../../models').User

module.exports = function createUserAndSession(req, res, next) {
  User.findOne({ email: req.body.email }, function (err, user) {
    if (user) res.status(406).send('email is in use. forgot password not yet implemented'); // TODO
    else {
      User.create({
        uid: req.body.email,
        email: req.body.email,
        hash: require('bcrypt').hashSync(req.body.password, 10),
        token: Math.random().toString(22).substring(2)
      }, function(err, user) {
        if (err) throw err;
        res.status(201).send({ token: user.token, _id: user._id });
      });
    }
  })
};
