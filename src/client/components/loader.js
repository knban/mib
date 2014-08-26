/**
* @jsx React.DOM
*/
module.exports = function (React) {
  var Loader = React.createClass({
    render: function () {
      var style = { display: this.props.show ? 'block' : 'none' };
      return <img src="images/ajax-loader.gif" style={style}></img>
    }
  })

  return Loader;
}
