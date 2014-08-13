var User = require('../../models').User;

module.exports = function loginRequired(req, res, next) {
  var token = req.headers['x-auth-token'] || req.query.token;
  if (token) {
    User.findOne({ token: token }).exec(function (err, user) {
      if (err) {
        logger.error(err.message)
        res.status(500).end();
      } else if (user) {
        req.user = user;
        next();
      } else {
        res.status(401).end();
      }
    })
  } else {
    res.status(401).end();
  }
};
