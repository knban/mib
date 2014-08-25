var Endpoint = require('./endpoint');
window.api = new Endpoint();
api.setRoot(window.location.origin+"/api/v1/");

window.app = angular.module('app', ['ui.select2', 'smart'])
.controller('SessionController', require('./controllers/session_controller'))
.controller('BoardController', require('./controllers/board_controller'))
.controller('ColumnController', require('./controllers/column_controller'))
.directive('ngTooltip', require('./directives/ng_tooltip'))
.directive('ngJsonreader', require('./directives/ng_jsonreader'))
.directive('ngDragndrop', require('ng-dragndrop'))
