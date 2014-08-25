/**
* @jsx React.DOM
*/
var _ = {
  map: require('lodash.map')
}
var dragndrop = require('dragndrop')
var Dropzone = require('../dropzone');

module.exports = ['$parse', function ($parse) {
  return {
    link: function (scope, $mount, attr) {
      var column = $parse(attr.reactColumn)(scope);

      var Card = React.createClass({
        render: function() {
          return <li data-id={this.props.id}
            className='list-group-item card'>
            {this.props.title}
          </li>;
        },
        componentDidMount: function () {
          dragndrop($(this.getDOMNode()), {})
        }
      })

      var Column = React.createClass({
        render: function() {
          var cards = _.map(column.cards, function (card) {
            var id = card._id
            var title = card.remoteObject.title
            return <Card id={id} title={title} />;
          })

          return <ul className='list-group'>{cards}</ul>;
        },
        componentDidMount: function () {
          var dropzone = new Dropzone(column.$controller)
          dragndrop($(this.getDOMNode()), { dropzone: dropzone })
        }
      });

      React.renderComponent(<Column />, $mount.get(0));
    }
  }
}]
