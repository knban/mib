var mongoose = require('mongoose'),
ObjectId = mongoose.Schema.Types.ObjectId,
relationship = require('mongoose-relationship');

var cardSchema = mongoose.Schema({
  repo_id: String,
  provider: String,
  remoteObject: Object,
  column: { type: ObjectId, ref: 'Column', childPath: 'cards' },
});

cardSchema.plugin(relationship, { relationshipPathName: ['column'] });  

module.exports = cardSchema;
