var helper = require('../test_helper'),
expect = helper.expect;

var Provider = helper.require('providers/github');

var li = require('li');

describe("GitHub Provider", function() {
  var board = null;
  var provider = null;
  var $http = null;

  beforeEach(function() {
    board = {
      importRepos: [],
      importReposNext: 'test',
      importReposLast: 'test'
    };
  });

  describe("getRepos without pagination", function() {
    beforeEach(function() {
      $http = helper.fake$http([
        { name: "repo1" }, { name: "repo2" }, { name: "repo3" }
      ]);
      provider = Provider(board, $http);
      provider.getRepos('url');
    });
    it("populates board.importRepos with 3 repos", function() {
      expect(board.importRepos.length).to.eq(3);
    });
    it("board.importReposLinks is null", function() {
      expect(board.importReposLinks).to.eq(null);
    });
  });

  describe("getRepos with pagination", function() {
    beforeEach(function() {
      $http = helper.fake$http([
        { name: "repo1" }, { name: "repo2" }, { name: "repo3" }
      ], li.stringify({
        next: 'link1',
        last: 'link2'
      }));
      provider = Provider(board, $http);
      provider.getRepos('url');
    });
    it("populates board.importRepos with 3 repos", function() {
      expect(board.importRepos.length).to.eq(3);
    });
    it("it sets board.importReposLinks with the parsed links object", function() {
      expect(board.importReposLinks).to.deep.eq({
        next: 'link1',
        last: 'link2'
      });
    });
  });
});

