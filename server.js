var dotenv = require('dotenv');
dotenv.load();


var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { colorize: true });

var loggly_options = {
  subdomain: process.env.LOGGLY_SUBDOMAIN,
  inputToken: process.env.LOGGLY_TOKEN,
  tags: ['mib_'+process.env.NODE_ENV],
  level: 'error'
}
if (loggly_options.subdomain && loggly_options.inputToken) {
  winston.add(require('winston-loggly').Loggly, loggly_options);
}

winston.add(winston.transports.File, { filename: "./logs/"+process.env.NODE_ENV+".log" });
var logger = winston;
logger.info('Chill Winston, the logs are being captured 3 ways- console, file, and Loggly');

var app = require(__dirname+'/src/server/app.js');
var port = process.env.PORT || 3000;
app.listen(port);
logger.info("Listening on http://0.0.0.0:"+port);
