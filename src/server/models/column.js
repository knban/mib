var mongoose = require('mongoose');
var columnSchema = require('./../schemata/column')

var Promise = require('bluebird');

columnSchema.statics.findByIdAndMutate = function(id, mutator) {
  var Column = this;
  return new Promise(function (resolve, reject) {
    Column.findOne({ _id : id }).exec(function(err, column) {
      if (err) throw err
      else if (column) {
        mutator(column);
        column.save(function (err) {
          if (err) {
            throw err;
          } else {
            return resolve(column);
          }
        });
      } else return reject(new Error("column not found"));
    });
  })
};

module.exports = mongoose.model('Column', columnSchema);
