var mongoose = require('mongoose'),
ObjectId = mongoose.Schema.Types.ObjectId,
relationship = require('mongoose-relationship');

var columnSchema = mongoose.Schema({
  name: String,
  board: { type: ObjectId, ref: 'Board', childPath: 'columns' },
  cards: [{ type: ObjectId, ref: 'Card', childPath: 'column' }],
});

columnSchema.plugin(relationship, { relationshipPathName: ['board', 'cards'] });  

module.exports = columnSchema;
