var app = angular.module('app', []);

require('./controllers/nav')(app);
require('./controllers/board')(app);

module.exports = app;
