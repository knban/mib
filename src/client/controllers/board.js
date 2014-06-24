module.exports = ['$http', function($http) {
  this.id = '1';
  this.name = "Empty Board"; 
  this.columns = [];
  var board = this;
  $http.get('/boards/'+board.id).success(function(data) {
    if (data.board) {
      board.name = data.board.name;
      board.columns = data.board.columns;
    }
  });
  this.removeColumn = function(col) {
    $http.delete('/boards/'+board.id+'/columns/'+col).success(function(data) {
      if (data.board)
        board.columns = data.board.columns;
    });
  }
  this.removeCard = function(col, row) {
    $http.delete('/boards/'+board.id+'/columns/'+col+'/cards/'+row).success(function(data) {
      if (data.board)
        board.columns = data.board.columns;
    });
  },
  this.addCard = function(col, body) {
    $http.post('/boards/'+board.id+'/columns/'+col+'/cards', body).success(function(data) {
      if (data.board)
        board.columns[col] = data.board.columns[col];
    });
  }
  this.availableImportProviders = [{
    name: "GitHub",
    next: function() {
      board.importProvider = this;
      board.importHelp = "Is it a personal repository or part of an organization?"
      board.importPersonalOrOrg = true;
    },
    personal: function() {
      board.importPersonalOrOrg = false;
      this.getRepos(app.session.auth.github.user.repos_url, 1);
    },
    org: function() {
      board.importPersonalOrOrg = false;
      board.importHelp = "Fetching organizations...";
      $http.get(app.session.auth.github.user.organizations_url).success(function(data) {
        board.importHelp = "Which organization owns the repository you wish to import issues from?";
        board.importOrgs = data;
      })
    },
    selectOrg: function(org) {
      board.importOrgs = false;
      this.getRepos(org.repos_url, 1);
    },
    getRepos: function(url, pageNum) {
      board.importHelp = "Fetching repositories...";
      $http.get(url+'?page='+pageNum).success(function(data) {
        board.importHelp = "Which repository do you wish to import issues from?";
        board.importRepos = data;
      })
    },
    importRepoIssues: function(repo) {
      board.closeImport();
      var importUrl = '/boards/'+board.id+'/columns/'+board.importCol+'/cards/import/github';
      $http.get(repo.issues_url.replace('{/number}','')+'?state=open').success(function(data) {
        console.log(data);
        $http.post(importUrl, { openIssues: data }).success(function(data) {
          if (data.board)
            board.columns = data.board.columns;
        });
      });
    },
    canImport: function(repo) {
      return repo.has_issues && repo.open_issues_count > 0;
    }
  }];
  this.importCards = function(col) {
    board.importing = true;
    board.importProvider = false;
    board.importCol = col;
    board.importOrgs = [];
    board.importHelp = "Choose the provider containing the repository whose issues you wish to import."
  }
  this.closeImport = function() {
    board.importing = false;
  }
}]
