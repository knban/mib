var _ = {
  map: require('lodash.map'),
  find: require('lodash.find'),
  remove: require('lodash.remove'),
  uniq: require('lodash.uniq')
}

function Dropzone(board, column) {
  this.board = board;
  this.column = column;
}

var drag = null;

Dropzone.prototype = {
  start: function (e) {
    drag = { events: [] }
    drag.events.push({
      type: 'start',
      card: $(e.item).data('id'),
      index: $(e.item).index(),
      column: this.column._id
    });
  },
  swapped: function ($1, $2) {
    drag.events.push({
      type: 'swap',
      column: this.column._id,
      cards: [$1.data('id'), $2.data('id')]
    });
    this.optimize();
  },
  removed: function ($el) {
    drag.temp = {
      type: 'removed',
      card: $el.data('id'),
      index: $el.index(),
      column: this.column._id
    }
  },
  appended: function ($el) {
    drag.events.push({
      type: 'move',
      card: $el.data('id'),
      prevIndex: drag.temp.index,
      newIndex: $el.index(),
      prevColumn: drag.temp.column,
      newColumn: this.column._id
    })
    drag.temp = null;
    this.optimize();
  },
  optimize: function () {
    _.remove(drag.events, function (e) {
      if (e.type === 'swap') {
        if (e.column !== this.column._id) return false;
        // remove swaps that cancel each other out
      } else if (e.type === 'move') {
        // remove moves that cancel each other out
      }
    }.bind(this));
  },
  end: function (e) {
    drag.events.push({
      type: 'end',
      card: $(e.item).data('id'),
      index: $(e.item).index(),
      column: this.column._id
    });
    drag = null;
  }
}

module.exports = Dropzone
