/**
* @jsx React.DOM
*/
var CardFace = React.createClass({
  render: function() {
    return <div>{this.props.data.title}</div>
  }
})

module.exports = CardFace;
