/**
* @jsx React.DOM
*/
var Loader = React.createClass({
  render: function () {
    var style = { display: this.props.show ? 'block' : 'none' };
    return <img src="images/ajax-loader.gif" style={style}></img>
  }
})

module.exports = Loader;
