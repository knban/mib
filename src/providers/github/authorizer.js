var rateLimit = {};

module.exports = function (uid, pw) {
  var now = Math.round((new Date()).getTime() / 1000);

  var credentials = new Buffer(uid+':'+pw).toString('base64');

  var fn = function (callback) {
    require('request')({
      method: "POST",
      url: 'https://api.github.com/authorizations',
      headers: {
        'User-Agent': 'keyvanfatehi/mib',
        'Authorization': 'Basic '+credentials
      },
      data: {
        "scopes": [
          "repo"
        ],
        "note": "keyvanfatehi/mib"
      }
    }, function (err, res, body) {
      rateLimit.remaining = parseInt(res.headers['x-ratelimit-remaining']);
      rateLimit.reset = parseInt(res.headers['x-ratelimit-reset']) - now;
      logger.warn('github rate limit', rateLimit);
      if (res.statusCode === 201) {
        callback(null, {
          auth: { github: body }
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
      logger.warn(err.message);
      return function(callback) { callback(err.message) };
    }
  } else {
    return fn;
  }
}
