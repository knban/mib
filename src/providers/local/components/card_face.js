/**
* @jsx React.DOM
*/
module.exports = function (React) {
  var CardFace = React.createClass({
    render: function() {
      return <div>{this.props.data.title}</div>
    }
  })

  return CardFace;
}
