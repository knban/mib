var GithubProvider = require('../providers/github').cardProvider;

module.exports = function (board, $http) {
  this.providers = [
    GithubProvider(board, $http)
  ];
  this.open = function() {
    this.isOpen = true;
    this._Provider = null;
    this._PersonalOrOrg = null;
    this._Orgs = null;
    this._Repos = null;
    this._ReposCurPage = null;
    this._ReposLinks = null;
    this._Help = "Choose the provider containing the repository from which you wish to import open issues.";
    this._Col = 0;
  }
  this.close = function() {
    this.isOpen = false;
    this._Col = null;
  }
};
