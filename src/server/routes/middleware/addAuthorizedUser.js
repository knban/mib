var ObjectId = require('mongoose').Types.ObjectId

module.exports = function addAuthorizedUser(req, res, next) {
  try {
    var user_id = ObjectId(req.params.user_id);
    if (req.board.authorizedUsers.indexOf(user_id) >= 0) {
      res.status(400).send('user already authorized');
    } else {
      req.board.authorizedUsers.push(user_id);
      req.board.save(function(err, board) {
        if (err) { res.status(500).send(err.message); }
        else { res.send({ authorizedUsers: board.authorizedUsers }) }
      });
    }
  } catch (err) {
    logger.error('addAuthorizedUser 400', err.message);
    res.status(400).send(err.message);
  }
};
