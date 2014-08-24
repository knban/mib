var _ = {
  map: require('lodash.map')
}

var dragEl =
  sameParent =
  null

function swapNodes(a, b) {
  if (a === b) return false;
  var aparent= a.parentNode;
  var asibling= a.nextSibling===b? a : a.nextSibling;
  b.parentNode.insertBefore(a, b);
  aparent.insertBefore(b, asibling);
  return true;
}

function swap(a, b) { return swapNodes(a.get(0), b.get(0)) }

module.exports = ['$parse', function ($parse) {
  return {
    compile: function ($el, attr) {
      var json = attr.ngDragndrop
        , options = null;

      return function (scope, $el) {
        if (json) {
          options = $parse(json)(scope);
        } else {
          options = { dropzone: false }
        }

        var events = {
          // Common
          dragover: function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            return false;
          }
        };

        if (options.dropzone) {
          $el.get(0).dropzone = options.dropzone;

          // Item enters the column
          events.dragenter = function (e) {
            if (dragEl) {
              sameParent = dragEl.parent().get(0) === $el.get(0)
              if (sameParent) return false;
              dragEl.parent().get(0).dropzone.removed(dragEl)
              $el.append(dragEl)
              dragEl.parent().get(0).dropzone.added(dragEl)
            }
          }
        } else {
          events.dragstart = function (e) {
            dragEl = $el;
            this.style.opacity = '0.4';
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData('text/plain', $el.text());
          }

          events.dragend = function () {
            this.style.opacity = '1';
          }

          // Item enters another item
          events.dragenter = function () {
            if (!dragEl) return false;
            // Logically this occurs after entering the column,
            // the setTimeout enforces this order in the event loop
            setTimeout(function () {
              var parent = dragEl.parent().get(0)
              var parentb = $el.parent().get(0)
              if (parent === parentb && swap(dragEl, $el)) {
                parent.dropzone.swapped(dragEl, $el);
              }
            }, 0);
          }

          $el.prop('draggable', true);
        }
        _.map(events, function (fn, name) {
          $el.get(0).addEventListener(name, fn, false);
        })
      }
    }
  }
}];
