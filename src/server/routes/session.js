var createSession = require('./middleware/createSession')
  , loginRequired = require('./middleware/loginRequired')
  , getSession = require('./middleware/getSession')

module.exports = function (r) {
  r.route('/session')
  /*
   * POST /session
   * Login and get back your token
   * Token must be sent in subsequent API requests via header X-Auth-Token
   * Request { provider: "local|github|etc", uid: "user", pw: "pass" }
   * Response { token: "..." }
   * Use this token via HTTP Header "X-Auth-Token" in all subsequent requests
   */
  .post(createSession)
  /*
   * GET /session
   * Get the contents of your session; i.e. 3rd party authorizations
   * Response { session: { authorizations: { github: { token: "..." } } } }
   */
  .get(loginRequired, getSession)
}
