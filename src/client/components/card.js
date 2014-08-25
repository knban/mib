/**
* @jsx React.DOM
*/
var dragndrop = require('dragndrop')

var providers = require('../../providers')

var Loader = require('./loader');

var Card = React.createClass({
  render: function() {
    var provider = providers[this.props.card.provider]
    var CardFace = provider.component('CardFace')

    return (
      <li data-id={this.props.card._id} className='list-group-item card'>
        <Loader show={this.props.card.isSyncing} />
        <CardFace data={this.props.card.remoteObject} />
      </li>
    )
  },
  componentDidMount: function () {
    dragndrop($(this.getDOMNode()), {})
  }
})

module.exports = Card;
