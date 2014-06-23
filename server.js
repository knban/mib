var dotenv = require('dotenv');
dotenv.load();
var app = require(__dirname+'/src/server/app.js');
var port = process.env.PORT || 3000;
app.listen(port);
console.log("Listening on http://0.0.0.0:"+port);
