/**
* @jsx React.DOM
*/

module.exports = function (React) {
  var dragndrop = require('dragndrop')
    , Card = require('./card')(React)

  var Column = React.createClass({
    renderCards: function () {
      this.setProps({ cards: this.props.cards })
    },
    render: function() {
      var cards = this.props.cards.map(function (card) {
        return <Card key={card._id} card={card} />
      })
      return <ul className='list-group'>{cards}</ul>
    },
    componentDidMount: function () {
      dragndrop($(this.getDOMNode()), { dropzone: this.props.dropzone })
    }
  })

  return Column;
}
