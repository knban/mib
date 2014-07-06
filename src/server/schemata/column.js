var mongoose = require('mongoose'),
ObjectId = mongoose.Schema.Types.ObjectId,
relationship = require('mongoose-relationship');

var columnSchema = mongoose.Schema({
  name: String,
  /* Role enum:
   * 0 - new cards belong here
   * 1 - done cards belong here
   */
  role: Number,
  board: { type: ObjectId, ref: 'Board', childPath: 'columns' },
  cards: [{ type: ObjectId, ref: 'Card', childPath: 'column' }],
});

columnSchema.plugin(relationship, { relationshipPathName: ['board', 'cards'] });  

module.exports = columnSchema;
