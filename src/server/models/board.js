var _ = require('lodash');
var mongoose = require('mongoose');
var boardSchema = require('./../schemata/board');

var Promise = require('bluebird');

boardSchema.statics.findOneAndPopulate = function(query) {
  var Board = this;
  return new Promise(function (resolve, reject) {
    Board.findOne(query).populate('columns').exec(function(err, board) {
      if (err) throw err
      else if (board) {
        mongoose.model('Card')
        .populate(board.columns, { path: 'cards' }, function(err) {
          if (err)  throw err;
          else return resolve(board);
        });
      } else return reject(new Error("board not found"));
    });
  })
};

boardSchema.statics.createWithDefaultColumns = function (attributes) {
  var Board = this;
  return new Promise(function (resolve, reject) {
    var Column = mongoose.model('Column');
    Promise.all([
      Board.create(attributes),
      Column.create({ name: "Icebox",  role: 1 }),
      Column.create({ name: "Backlog"          }),
      Column.create({ name: "Doing"            }),
      Column.create({ name: "Done",    role: 2 })
    ]).spread(function (board, icebox, backlog, doing, done) {
      board.columns.push(icebox);
      board.columns.push(backlog);
      board.columns.push(doing);
      board.columns.push(done);
      board.save(function(err, board) {
        if (err) reject(err);
        else resolve(board)
      })
    }).catch(reject)
  });
};

boardSchema.statics.createViaImport = function (data, attributes) {
  var Board = this;
  return new Promise(function (resolve, reject) {
    var Column = mongoose.model('Column');
    var Card = mongoose.model('Card');
    var promises = [ Board.create(attributes) ];

    _.each(data.columns, function(column) {
      var promise = Column.create(_.omit(column, [
        '__v', '_id', 'cards', 'board'
      ]));
      promise.then(function(col) {
        return new Promise(function(resolve, reject) {
          var cardPromises = [];
          _.each(column.cards, function (card) {
            var cardPromise = Card.create(_.omit(card, [
              '__v', '_id', 'column'
            ]));
            cardPromises.push(cardPromise);
          });
          Promise.all(cardPromises).spread(function() {
            _.each(_.toArray(arguments), function (card) {
              col.cards.push(card);
            });
            col.save(function(err, col) {
              if (err) reject(err);
              else resolve(col)
            })
          }).catch(reject);
        })
      });
      promises.push(promise);
    });

    Promise.all(promises).spread(function () {
      var args = _.toArray(arguments);
      var board = args[0];
      var columns = _.rest(args);
      _.each(columns, function (column) {
        board.columns.push(column);
      });
      board.save(function(err, board) {
        if (err) reject(err);
        else resolve(board)
      })
    }).catch(reject)
  });
};

module.exports = mongoose.model('Board', boardSchema);
