var express = require('express');
var r = module.exports = express.Router();

r.get('/session.json', function(req, res, next) {
  res.send(req.session);
});
