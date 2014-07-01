var Endpoint = require('./endpoint');
window.api = new Endpoint();
var config = require('../../etc/config.js') || require('../../etc/config.js');
api.setRoot(config.endpoint);

var requires = ['ui.select2', 'smart'];
if (window.ionic) requires.push('ionic');

window.app = angular.module('app', requires)
.controller('SessionController', require('./controllers/session_controller'))
.controller('BoardController', require('./controllers/board_controller'))
.controller('IonicLoginModalController', require('./controllers/ionic_login_modal_controller'));


/*
 * Add a bootstrap3 tooltip to the element */
app.directive('ngTooltip', function () {
  return {
    link: function(scope, iElement, iAttrs) {
      iElement.data('toggle', 'tooltip');
      iElement.data('placement', 'bottom')
      iElement.data('title', iAttrs.ngTooltip);
      iElement.tooltip();
    }
  }
});

/*
 * Reads a file input field and parses it into an ngModel */
app.directive('ngJsonreader', ['$sce', function ($sce) {
  return {
    restrict: 'A',
    require: '^ngModel',
    link: function(scope, element, attrs, ngModel) {
      // Listen for change events to enable binding
      element.on('change', function(e) {
        ngModel.$setViewValue("Reading "+e.target.files[0].name);
        scope.$apply(function () {
          var reader = new FileReader();
          reader.onload = function (e) {
            var data = {};
            try {
              data = JSON.parse(reader.result);
              ngModel.$setViewValue(data);
            } catch (err) {
              ngModel.$setViewValue("Failed to parse JSON");
            }
            scope.$apply();
          };
          reader.readAsText(e.target.files[0]);
        });
      });
    }
  }
}]);
