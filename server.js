var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { colorize: true });

try {
  var dotenv = require('dotenv');
  dotenv.load();
} catch (e) {}

var app = require(__dirname+'/src/server/app.js');
var port = process.env.PORT || 3000;
app.listen(port);
winston.info("Listening on http://0.0.0.0:"+port);
