var express = require('express'),
app = express(),
http = require('http').Server(app),
io = require('socket.io')(http),
logger = require('morgan'),
bodyParser = require('body-parser'),
cookieSession = require('cookie-session'),
everyauth = require('everyauth');

app.use(express.static(__dirname + '/../../public'));

if (process.env.NODE_ENV === "development") {
  app.use('/cov', express.static(__dirname + '/../../coverage/lcov-report'));

  global.debug = function (obj) {
    var beautify = require('js-beautify').js_beautify;
    output = beautify(JSON.stringify(obj), { indent_size: 2});
    console.log(output);
  };
}

require('./auth/github.js')(everyauth);

app.use(logger());
app.use(cookieSession({
  keys: ['secret1', 'secret2'],
  secureProxy: true
}));
app.use(bodyParser.json());
app.use(everyauth.middleware());
app.use(require('./router'));

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/mib");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo connection error:'));
module.exports = http;
