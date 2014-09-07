var _ = { values: require('lodash.values') };

module.exports = function (board, $http) {
  this.providers = _.values(board.providers);
  this.open = function() {
    this.reset();
    this.isOpen = true;
  }
  this.close = function() {
    this.isOpen = false;
    this.reset();
  }
  this.reset = function () {
    this.view = 'views/project_linker.html';
    this._Provider = null;
    this._PersonalOrOrg = null;
    this._ShowAuthorizationForm = false;
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
  this.reset();
};
