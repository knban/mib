var _ = {
  map: require('lodash.map')
}

var dragEl =
  sameParent = null;

function swapNodes(a, b) {
  if (a === b) return false;
  var aparent= a.parentNode;
  var asibling= a.nextSibling===b? a : a.nextSibling;
  b.parentNode.insertBefore(a, b);
  aparent.insertBefore(b, asibling);
  return true;
}

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
          // Item enters the column
          events.dragenter = function (e) {
            if (dragEl) {
              sameParent = dragEl.parent().get(0) === $el.get(0)
              if (sameParent) return false;
              $el.append(dragEl)
              console.log('moved node to column');
            }
          }
        } else {
          $el.prop('draggable', true);
          events.dragstart = function (e) {
            dragEl = $el;
            this.style.opacity = '0.4';
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData('text/plain', $el.text());
          }

          events.dragend = function () {
            this.style.opacity = '1';
            dragEl = null;
            console.log('done');
          }

          // Item enters another item
          events.dragenter = function () {
            if (!dragEl) return false;
            // Logically this occurs after entering the column,
            // the setTimeout enforces this order in the event loop
            setTimeout(function () {
              sameParent = dragEl.parent().get(0) === $el.parent().get(0)
              if (sameParent) {
                if (swapNodes(dragEl[0], $el[0])) {
                  console.log('swapped nodes');
                }
              }
            }, 0);
          }

        }
        _.map(events, function (fn, name) {
          $el.get(0).addEventListener(name, fn, false);
        })
      }



      /*
      var opts = {}
      var group = attr['group'];
      var onAdd = $parse(attr['added']);
      var onRemove = $parse(attr['removed']);
      var onUpdate = $parse(attr['updated']);
      return function (scope, element) {
        var bind = function (fn) {
          return function (event) {
            scope.$apply(function() {
              fn(scope, {$event:event});
            });
          }
        };
        if (group)    opts.group    = group;
        if (onAdd)    opts.onAdd    = bind(onAdd);
        if (onRemove) opts.onRemove = bind(onRemove);
        if (onUpdate) opts.onUpdate = bind(onUpdate);
      };
      */
    }
  }
}];
