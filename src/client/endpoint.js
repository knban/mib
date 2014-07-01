var Endpoint = function () {
  this.root = "/";
};

Endpoint.prototype = {
  setRoot: function(root) {
    this.root = root;
  },
  route: function (route) {
    return this.root+route;
  }
}

module.exports = Endpoint;
