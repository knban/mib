var mongoose = require('mongoose');
var boardSchema = require('./../schemata/board');

var Promise = require('bluebird');

boardSchema.statics.findOneAndPopulate = function(query) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.findOne(query).populate('columns').exec(function(err, board) {
      if (err) { 
        return reject(err);
      } else if (board) {
        mongoose.model('Card').populate(board.columns, { path: 'cards' }, function(err) {
          if (err) {
            return reject(err)
          } else {
            return resolve(board);
          }
        });
      } else {
        return reject(new Error("board not found"));
      }
    });
  })
};
module.exports = mongoose.model('Board', boardSchema);
