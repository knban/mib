var info = {
  name: "local",
  displayName: "Local"
};

module.exports = {
  info:info,
  authorizer: require('./authorizer'),
  component: function (name) {
    return require('./components')[name]
  }
};

