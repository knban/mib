/**
* @jsx React.DOM
*/
var Dropzone = require('../dropzone');
var Column = require('../components').Column;

module.exports = ['$parse', function ($parse) {
  return {
    link: function (scope, $mount, attr) {
      var column = $parse(attr.reactColumn)(scope);
      var dropzone = new Dropzone(column.$controller)

      column.$component = React.renderComponent(
        <Column
          cards={column.cards}
          dropzone={dropzone}
        />, $mount.get(0)
      )
    }
  }
}]
