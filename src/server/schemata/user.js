var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  uid: String,
  hash: String,
  token: String,
  session: Object,
  authorizations: Object
});

module.exports = userSchema;
