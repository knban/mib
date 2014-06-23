var express = require('express'),
app = express(),
logger = require('morgan'),
bodyParser = require('body-parser'),
cookieSession = require('cookie-session'),
everyauth = require('everyauth');
require('./auth/github.js')(everyauth);

app.use(logger());
app.use(cookieSession({
  keys: ['secret1', 'secret2'],
  secureProxy: true
}));
app.use(bodyParser.json());
app.use(everyauth.middleware());
app.use(express.static(__dirname + '/../../public'));
var router = require('./router');
app.use(router);
module.exports = app;
