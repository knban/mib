var _ = {
  merge: require('lodash.merge')
};

var Endpoint = function () {
  this.root = "/";
};

Endpoint.prototype = {
  setRoot: function(root) {
    this.root = root;
  },
  setClient: function (name, client, defaults) {
    if (name === 'angular') {
      this.angular = true;
      this.client = client;
      this.defaults = defaults;
    } else {
      throw new Error("Unknown client "+name);
    }
  },
  url: function (route) {
    if (/^https?:\/\//.test(route)) {
      return route;
    } else {
      return this.root+route;
    }
  },
  options: function (method, path, data) {
    return _.merge({
      method: method,
      url: this.url(path),
      data: data
    }, this.defaults);
  },
  get: function (path) {
    return this.client(this.options("GET", path));
  },
  post: function (path, data) {
    return this.client(this.options("POST", path, data));
  },
  put: function (path, data) {
    return this.client(this.options("PUT", path, data));
  },
  delete: function (path) {
    return this.client(this.options("DELETE", path));
  }
}

module.exports = Endpoint;
