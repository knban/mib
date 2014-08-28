/**
* @jsx React.DOM
*/
var NewCardForm = require('../components').NewCardForm(React, api);

module.exports = ['$parse', function ($parse) {
  return {
    link: function (scope, $mount, attr) {
      var column = $parse(attr.column)(scope);
      var post = function (data) {
        return api.post('columns/'+column._id+'/cards', data);
      }
      var close = function () {
        scope.$apply(function () {
          column.$newcard = null
        })
      }
      React.renderComponent(
        <NewCardForm close={close} post={post} column={column}  />
        , $mount.get(0)
      )
    }
  }
}]
