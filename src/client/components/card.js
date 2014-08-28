/**
* @jsx React.DOM
*/
module.exports = function (React) {
  var dragndrop = require('dragndrop')

  var providers = require('../../providers')

  var Loader = require('./loader')(React);

  var Card = React.createClass({
    render: function() {
      var provider = providers[this.props.card.provider]
      var CardFace = provider.component('CardFace')(React);

      return (
        <li data-id={this.props.card._id} className='list-group-item card'>
          <Loader show={this.props.syncing} />
          <CardFace data={this.props.card.remoteObject} />
        </li>
      )
    },
    componentDidMount: function () {
      dragndrop($(this.getDOMNode()), {})
    }
  })

  return Card;
}
