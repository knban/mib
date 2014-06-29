window.app = angular.module('app', ['ui.select2', 'smart'])
.controller('SessionController', require('./controllers/session_controller'))
.controller('BoardController', require('./controllers/board_controller'))

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
