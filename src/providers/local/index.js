var info = {
  name: "local",
  displayName: "Local"
};

module.exports = {
  info:info,
  authorizer: require('./authorizer')
};

