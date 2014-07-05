var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  uid: String,
  hash: String,
  token: String,
  session: Object
});

module.exports = userSchema;
