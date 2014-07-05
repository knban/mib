var info = {
  name: "github",
  displayName: "GitHub",
  iconUrl: "/images/github_48px.png"
};

module.exports = {
  info:info,
  cardHandler: require('./card_handler')(info),
  cardProvider: require('./card_provider')(info),
  authorizer: require('./authorizer')
};

