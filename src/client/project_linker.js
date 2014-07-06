var GithubProvider = require('../providers').github.cardProvider;

module.exports = function (boardCtrl, tokens, $http) {
  this.providers = [];
  if (tokens.github) {
    var token = tokens.github;
    this.providers.push( GithubProvider(boardCtrl.attributes, this, token, $http) )
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
