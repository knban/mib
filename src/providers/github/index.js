var info = {
  name: "github",
  displayName: "GitHub",
  iconUrl: "/images/github_48px.png"
};


module.exports.info = info;
module.exports.cardHandler = require('./card_handler')(info);
module.exports.cardProvider = require('./card_provider')(info);
