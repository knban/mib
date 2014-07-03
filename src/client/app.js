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
.directive('ngSortable', require('./directives/ng_sortable'))
