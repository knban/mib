var http = require(__dirname+'/src/server/app.js').http;
var port = process.env.PORT || 3000;
http.listen(port, '0.0.0.0');
require('winston').info("listening on http://0.0.0.0:"+port);
