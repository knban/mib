var Promise = require('bluebird')

module.exports = function saveCardsViaPromises(req, res, next) {
  Promise.all(req.promises).spread(function () {
    req.board.update({ columns: req.board.columns }, function(err) {
      if (err) res.status(500).send(err.message);
      else next()
    });
  });
};
