var addCard = require('./middleware/addCard')

module.exports = function (r) {
  /*
   * POST /columns/:id/cards
   * Creates a card at the top of a column
   */
  r.route('/columns/:id/cards').post(addCard)
}
