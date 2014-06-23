module.exports = function(everyauth) {
  everyauth.github
  .appId(process.env.GITHUB_CLIENT_ID)
  .appSecret(process.env.GITHUB_CLIENT_SECRET)
  .entryPath('/auth/github')
  .callbackPath('/auth/github/callback')
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
}
