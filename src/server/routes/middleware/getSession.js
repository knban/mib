module.exports = function getSession(req, res, next) {
  res.send(req.user);
};

