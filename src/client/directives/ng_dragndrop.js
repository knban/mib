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
}

module.exports = ['$parse', function ($parse) {
  return {
    compile: function ($el, attr) {
      var json = attr.ngDragndrop
        , options = null;

      return function (scope, $el) {
        var events = null;
        if (json) {
          options = $parse(json)(scope);
        } else {
          options = { dropzone: false }
        }

        if (options.dropzone) {
          events = {

            // Card dragging over a column
            dragenter: function (e) {
              if (dragEl) {
                if (dragEl.parent().get(0) === $el.get(0)) {
                  sameParent = true;
                } else {
                  sameParent = false;
                  $el.prepend(dragEl)
                }
              } else {
                console.log('nothing to drag');
              }
            },

            dragover: function (e) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              return false;
            }

          }
        } else {
          events = {

            dragstart: function (e) {
              dragEl = $el;
              this.style.opacity = '0.4';
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData('text/plain', $el.text());
            },

            // Card dragging over another card
            dragover: function (e) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              return false;
            },

            dragend: function () {
              this.style.opacity = '1';
              dragEl = null;
              console.log('done');
            },

            dragenter: function () {
              if (sameParent)
                swapNodes(dragEl[0], $el[0]);
              // If new parent, don't swap
            }

          }
          $el.prop('draggable', true);
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
