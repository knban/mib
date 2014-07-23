var app = require(__dirname+'/src/server/app.js');
var port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0');
require('winston').info("listening on http://0.0.0.0:"+port);
