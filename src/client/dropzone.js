var _ = {
  remove: require('lodash.remove')
}

function Dropzone(columnCtrl) {
  this.controller = columnCtrl
  this.column = columnCtrl.column;
}

var drag = null;

Dropzone.prototype = {
  start: function (e) {
    drag = {
      card: $(e.item).data('id'),
      start: {
        index: $(e.item).index(),
        column: this.column._id
      }
    };
  },
  swapped: function ($1, $2) {
    drag.swaps = drag.swaps || []
    drag.swaps.push([$1.data('id'), $2.data('id')])
  },
  removed: function ($el) {
    drag.swaps = null;
    delete drag.swaps;
  },
  appended: function ($el) {
    var tx = {
      index: $el.index(),
      column: this.column._id
    }
    if (drag.start.column !== tx.column)
      drag.transfer = tx;
    else
      delete drag.transfer;
  },
  end: function (e) {
    drag.end = {
      index: $(e.item).index(),
      column: this.column._id
    };
    // drag object can contain transfer and/or swaps
    // you should always process the transfer first
    // and then process all the swaps, if any
    if (drag.transfer || drag.swaps)
      this.controller.commitDrag(drag); 
  }
}

module.exports = Dropzone
