var createUserAndSession = require('./middleware/createUserAndSession')

module.exports = function (r) {
  r.route('/users')
  /*
   * POST /users
   * Creates a user
   * TODO needs regression test
   */
  .post(createUserAndSession);
}
