var ObjectId = require('mongoose').Types.ObjectId

module.exports = function removeAuthorizedUser(req, res, next) {
  try {
    var user_id = ObjectId(req.params.user_id);
    var index = req.board.authorizedUsers.indexOf(user_id);
    if (index >= 0) {
      req.board.authorizedUsers.splice(index, 1);
      req.board.save(function(err, board) {
        if (err) { res.status(500).send(err.message); }
        else { res.send({ authorizedUsers: board.authorizedUsers }) }
      });
    } else {
      res.status(404).send('user not authorized');
    }
  } catch (err) {
    logger.error('removeAuthorizedUser 400', err.message);
    res.status(400).send(err.message);
  }
};

