var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  uid: String,
  email: String,
  hash: String,
  token: String,
  session: Object,
  authorizations: Object
});

module.exports = userSchema;
