var Endpoint = require('./endpoint');
window.api = new Endpoint();
api.setRoot(AppConfig.endpoint);

var requires = ['ui.select2', 'smart'];
if (window.ionic) requires.push('ionic');

window.app = angular.module('app', requires)
.controller('SessionController', require('./controllers/session_controller'))
.controller('BoardController', require('./controllers/board_controller'))
.controller('IonicLoginModalController', require('./controllers/ionic_login_modal_controller'))
.directive('ngTooltip', require('./directives/ng_tooltip'))
.directive('ngJsonreader', require('./directives/ng_jsonreader'))
.directive('ngSortable', ['$parse', function ($parse) {
  return {
    compile: function ($element, attr) {
      console.log($element, attr);
      var fn = $parse(attr['ngSortable']);
      console.log(fn);
      fn();
      return function (scope, element) {
        element.on('ng-sortable', function(event) {
          scope.$apply(function() {
            fn(scope, {$event:event});
          });
        });
      };
    },
    link: function(scope, iElement, iAttrs) {
      scope.sortable = new Sortable(iElement.get(0), {
        group: "column",
        onUpdate: function (e) {
          console.log(e.item);
        }
      });
    }
  }
}]);
