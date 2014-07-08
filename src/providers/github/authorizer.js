var rateLimit = {};

var client_id = process.env.GITHUB_CLIENT_ID;
var secret = process.env.GITHUB_CLIENT_SECRET;

var misconfigured = false;

if (!client_id || !secret) {
  misconfigured = true;
}

module.exports = function (uid, pw) {
  if ( misconfigured ) throw new Error("github auth disabled")
  var now = Math.round((new Date()).getTime() / 1000);
  var credentials = new Buffer(uid+':'+pw).toString('base64');

  var fn = function (callback) {
    require('request')({
      method: "PUT",
      url: 'https://api.github.com/authorizations/clients/'+client_id,
      headers: {
        'User-Agent': 'keyvanfatehi/mib',
        'Authorization': 'Basic '+credentials
      },
      body: JSON.stringify({
        client_secret: secret,
        scopes: [
          "repo"
        ],
        note: "keyvanfatehi/mib"
      })
    }, function (err, res, body) {
      credentials = null;
      rateLimit.remaining = parseInt(res.headers['x-ratelimit-remaining']);
      rateLimit.reset = parseInt(res.headers['x-ratelimit-reset']) - now;
      if (res.statusCode === 201 || res.statusCode === 200) {
        var data = JSON.parse(body);
        callback(null, {
          login: uid,
          token: data.token
        });
      } else {
        callback(new Error(body));
      }
    });
  };

  if (rateLimit.remaining === 0) {
    if (rateLimit.reset < 0) {
      return fn;
    } else {
      var err = new Error("Rate limit reached. Please wait "+rateLimit.reset+" more seconds");
      return function(callback) { callback(err.message) };
    }
  } else {
    return fn;
  }
}
