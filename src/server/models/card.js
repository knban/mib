var mongoose = require('mongoose');
var cardSchema = require('./../schemata/card')
var ObjectId = mongoose.Types.ObjectId; 

var Promise = require('bluebird');

cardSchema.statics.updateRemoteObject = function(_card) {
  var Card = this;
  return new Promise(function (resolve, reject) {
    Card.findOne({ _id : ObjectId(_card._id) }).exec(function(err, card) {
      if (err) throw err
      else if (card) {
        card.remoteObject = null;
        card.remoteObject = _card.remoteObject;
        card.save(function (err) {
          if (err) {
            throw err;
          } else {
            return resolve(card);
          }
        });
      } else return reject(new Error("card not found"));
    });
  })
};

module.exports = mongoose.model('Card', cardSchema);
