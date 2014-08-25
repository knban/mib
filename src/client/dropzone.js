var _ = { isEqual: require('lodash.isequal') }

function Dropzone(columnCtrl) {
  this.controller = columnCtrl
  this.column = columnCtrl.column;
}

var drag = null;

Dropzone.prototype = {
  start: function (e) {
    drag = null;
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
    var swap = [$1.data('id'), $2.data('id')]
    var lastIndex = drag.swaps.length-1;
    var lastSwap = drag.swaps[lastIndex]
    if (lastSwap) {
      if (_.isEqual(swap, lastSwap)) {
        // Cancels out, remove it and don't add this swap.
        drag.swaps.splice(lastIndex, 1)
        return false;
      }
    }
    drag.swaps.push(swap)
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
