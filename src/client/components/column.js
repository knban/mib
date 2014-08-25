/**
* @jsx React.DOM
*/
var dragndrop = require('dragndrop')
  , Card = require('./card')

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

module.exports = Column;
