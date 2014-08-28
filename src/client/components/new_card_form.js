/**
* @jsx React.DOM
*/
module.exports = function (React) {
  var NewCardForm = React.createClass({
    render: function() {
      return (
        <form className="well clearfix" onSubmit={this.onSubmit} role="form">
          <div className="form-group">
            <input type="text" ref="title" autofocus className="form-control" />
          </div>
          <button type="submit" className="pull-right btn btn-success">Create</button>
          <button className="pull-left btn btn-default" onClick={this.close}>Close</button>
        </form>
      )
    },
    close: function () {
      this.props.close();
    },
    isValid: function (card) {
      var title = card.remoteObject.title;
      return title && title.length > 0
    },
    onSubmit: function (e) {
      e.preventDefault();
      var card = {
        _id: Math.random().toString(16).substring(2),
        isSyncing: true,
        provider: "local",
        remoteObject: {
          title: this.refs.title.getDOMNode().value
        }
      };
      if (! this.isValid(card)) return false;
      var column = this.props.column;
      this.props.column.$component.addCard(card, function (card, done) {
        this.props.post({
          provider: card.provider,
          remoteObject: card.remoteObject
        }).success(function(data) {
          card._id = data.card._id;
          done();
        });
      }.bind(this))
      // clear the form
      // hide the form
    },
    componentDidMount: function () {
      
    }
  })

  return NewCardForm;
}
