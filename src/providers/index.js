var providers = {
  github: require('mib-github'),
  local: require('./local')
};

providers.prepare = function (tokens, $http, boardCtrl, api) {
  var Endpoint = require('../client/endpoint');
  var all = {};
  if (tokens.github) {
    var github = new Endpoint();
    github.setRoot('https://api.github.com/');
    github.setClient('angular', $http, {
      headers: { 'Authorization': 'token '+tokens.github }
    });
    all.github = providers.github.cardProvider(boardCtrl, api, github);
  };
  return all;
};

module.exports = providers;
