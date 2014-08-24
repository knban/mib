var dragEl = null

function swapNodes(a, b) {
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
        if (json) {
          options = $parse(json)(scope);
        } else {
          options = { dropzone: false }
        }

        if (options.dropzone) {
          function dropZoneEnter(e) {
            if (dragEl) {
              if (dragEl.parent().get(0) === $el.get(0)) {
                console.log('same parent');
              } else {
                $el.prepend(dragEl)
              }
            } else {
              console.log('nothing to drag');
            }
          }; 
          $el.get(0).addEventListener('dragenter', dropZoneEnter, true);
        } else {
          function dragStart(e) {
            dragEl = $el;
            this.style.opacity = '0.4';
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData('text/plain', $el.text());
          }

          function dragOver(e) {
          }

          function dragEnd(e) {
            this.style.opacity = '1';
            dragEl = null;
          }

          function dragEnter(e) {
            //swapNodes(dragEl[0], $el[0]);
          }

          $el.get(0).addEventListener('dragstart', dragStart, false);
          $el.get(0).addEventListener('dragover', dragOver, false);
          $el.get(0).addEventListener('dragend', dragEnd, false);
          $el.get(0).addEventListener('dragenter', dragEnter, false);
          $el.prop('draggable', true);
        }
      };



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
