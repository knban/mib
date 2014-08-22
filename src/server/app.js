var logger = require('winston'),
express = require('express'),
app = express(),
http = require('http').Server(app),
io = require('socket.io')(http),
browserify = require('browserify-middleware'),
bodyParser = require('body-parser');

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { colorize: true });

try {
  var dotenv = require('dotenv');
  dotenv.load();
} catch (e) {}

app.use('/js/bundle.js', browserify(__dirname+'/../client/app.js'));
app.use(express.static(__dirname + '/../../public'));

if (process.env.NODE_ENV === "development") {
  logger.info('development mode');
  app.use('/cov', express.static(__dirname + '/../../coverage/lcov-report'));

  app.use(function (req, res, next) {
    logger.info(req.method + " " + req.path);
    next();
  });

  global.debug = function (obj) {
    var beautify = require('js-beautify').js_beautify;
    output = beautify(JSON.stringify(obj), { indent_size: 2});
    logger.info(output);
  };
}

// Cross Domain
var allowCrossDomain = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Expose-Headers", "X-Filename");
  res.header("Access-Control-Allow-Headers", "Referer, Range, Accept-Encoding, Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  next();
};

app.use(allowCrossDomain);
app.use(bodyParser.json({limit: '10mb'}));
app.use('/api/v1/', require('./routes'));

var mongoose = require('mongoose');
var mongodb_uri = process.env.MONGODB_URI || "mongodb://localhost/mib";
mongoose.connect(mongodb_uri);
var db = mongoose.connection;
db.on('error', logger.error.bind(logger, 'connection error '+mongodb_uri));

module.exports = {
  http: http,
  app: app,
  io: io
}
