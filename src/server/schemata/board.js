var mongoose = require('mongoose'),
ObjectId = mongoose.Schema.Types.ObjectId,
relationship = require('mongoose-relationship');

var boardSchema = mongoose.Schema({
  name: String,
  columns: [{ type: ObjectId, ref: 'Column', childPath: 'board' }],
  links: Object,
  authorizedUsers: Array
});

boardSchema.plugin(relationship, { relationshipPathName: ['columns'] });  

module.exports = boardSchema;
