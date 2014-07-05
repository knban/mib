var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  token: String
});

module.exports = userSchema;
