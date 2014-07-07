var providers = require('../providers');
var Endpoint = require('./endpoint');

module.exports = function (boardCtrl, tokens, $http) {
  this.providers = [];
  if (tokens.github) {
    var github = new Endpoint();
    github.setRoot('https://api.github.com/');
    github.setClient('angular', $http, {
      headers: { 'Authorization': 'token '+tokens.github }
    });
    var api = window.api;
    var provider = providers.github.cardProvider(boardCtrl.attributes, api, github, this);
    this.providers.push(provider);
  };
  this.open = function() {
    this.reset();
    this.isOpen = true;
  }
  this.close = function() {
    this.isOpen = false;
    this.reset();
  }
  this.reset = function () {
    this._Provider = null;
    this._PersonalOrOrg = null;
    this._Orgs = null;
    this._Repos = null;
    this._ReposToImport = [];
    this.fetchedAllRepos = false;
    this._WantedReposIds = null;
    this._Help = "Choose the provider containing the repository from which you wish to import open issues.";
    this._Col = 0;
    this._ReposToImport = null;
    this.fetchedAllRepos = null;
  };
};
