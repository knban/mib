var boardSchema = require('./../schemata/board');
boardSchema.methods.addCard = function(card) {
  console.log("adding card"+card);
};
module.exports = require('mongoose').model('Board', boardSchema);
