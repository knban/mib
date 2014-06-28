window.app = angular.module('app', [])
.controller('SessionController', require('./controllers/session_controller'))
.controller('BoardController', require('./controllers/board_controller'))

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
