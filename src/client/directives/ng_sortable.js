/*
 * Angular directive for the kickass Sortable library
 * https://github.com/RubaXa/Sortable
 */
module.exports = ['$parse', function ($parse) {
  return {
    compile: function ($element, attr) {
      var opts = {}
      var group = attr['sortableGroup'];
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
        scope.sortable = new Sortable(element.get(0), opts);
      };
    }
  }
}];
