var li = require('li');

module.exports = function(board, $http) {
  return  {
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
        board.importHelp = "Which organization owns the repository from which you wish to import open issues?";
        board.importOrgs = data;
      })
    },
    selectOrg: function(org) {
      board.importOrgs = false;
      this.getRepos(org.repos_url, 1);
    },
    getRepos: function(url, pageNum) {
      board.importHelp = "Fetching repositories...";
      $http.get(url+'?page='+pageNum+'&type=all').success(function(data, status, headers, config) {
        board.importHelp = "Which repository do you wish to import issues from?";
        board.importRepos = data;
        board.importReposNext = null;
        board.importReposLast = null;
        board.importReposLinks = li.parse(headers('Link'));
      })
    },
    importRepoIssues: function(repo) {
      repo.imported = true;
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
  }
}
