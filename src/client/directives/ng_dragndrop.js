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
          options = {
            dropzone: false
          }
        }

        if (options.dropzone) {
          $el.on('dragenter', function () {
            if (dragEl.parent().get(0).isSameNode($el.get(0))) {
              console.log('samenode');
            } else {
              $el.append(dragEl)
            }
          });
        } else {
          $el.prop('draggable', true);
          $el.on('dragstart', function () {
            dragEl = $el;
            this.style.opacity = '0.4';
          });
          $el.on('dragend', function () {
            this.style.opacity = '1';
          });
          $el.on('dragenter', function () {
            swapNodes(dragEl[0], $el[0]);
            //console.log(dragEl.text());
            //console.log($el.text());
          });
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
