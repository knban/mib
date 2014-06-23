module.exports = function(app) {
  app.controller('BoardController', function() {
    this.name = "New Board"; 
    this.columns = [{
      name: "Inbox",
      cards: [{
        title: "Stuff"
      }]   
    }, {
      name: "Doing"
    }, {
      name: "Done"
    }]
  });
}
