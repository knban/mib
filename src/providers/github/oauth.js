everyauth = require('everyauth');
module.exports = function(opts) {
  var id = process.env.GITHUB_CLIENT_ID;
  var secret = process.env.GITHUB_CLIENT_SECRET;
  if (! id) throw new Error("Missing environment variable GITHUB_CLIENT_ID");
  if (! secret) throw new Error("Missing environment variable GITHUB_CLIENT_SECRET");
  everyauth.github
  .appId(id)
  .appSecret(secret)
  .entryPath(opts.entryPath)
  .callbackPath(opts.callbackPath)
  .scope('repo') // Can be set to a combination of: 'user', 'public_repo', 'repo', 'gist'
  .findOrCreateUser( function (session, accessToken, accessTokenExtra, githubUserMetadata) {
    session.oauth = accessToken;
    return session.uid = githubUserMetadata.login;
  })
  .redirectPath('/');
  everyauth.everymodule.handleLogout( function (req, res) {
    req.logout(); 
    req.session.uid = null;
    res.writeHead(303, { 'Location': this.logoutRedirectPath() });
    res.end();
  });
  return everyauth.middleware();
}
