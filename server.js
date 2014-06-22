var app = require(__dirname+'/src/server/app.js');
var port = process.env.PORT || 3000;
app.listen(3000);
console.log("Listening on http://0.0.0.0:"+port);
