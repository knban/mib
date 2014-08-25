/**
* @jsx React.DOM
*/
var _ = { map: require('lodash.map') }
  , dragndrop = require('dragndrop')
  , Card = require('./card')

var Column = React.createClass({
  renderCards: function () {
    this.setProps({ cards: this.props.cards })
  },
  render: function() {
    var cards = _.map(this.props.cards, function (card) {
      return <Card card={card} />
    })
    return <ul className='list-group'>{cards}</ul>
  },
  componentDidMount: function () {
    dragndrop($(this.getDOMNode()), { dropzone: this.props.dropzone })
  }
})

module.exports = Column;
