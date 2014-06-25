var helper = require('../test_helper'),
expect = helper.expect;

var Provider = helper.require('providers/github').cardProvider;

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
      $http = helper.fake$http();
      $http.stub('get', function(stub) {
        return stub.yields([
          { name: "repo1" }, { name: "repo2" }, { name: "repo3" }
        ], 200, function linkHeaders() {return ''});
      });
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
      $http = helper.fake$http();
      $http.stub('get', function(stub) {
        return stub.yields([
          { name: "repo1" }, { name: "repo2" }, { name: "repo3" }
        ], 200, function linkHeaders() {
          return li.stringify({ next: 'link1', last: 'link2' })
        });
      });
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

  describe("importRepoIssues", function() {
    var stub = null;

    describe("issues not paginated", function() {
      beforeEach(function() {
        $http = helper.fake$http();
        $http.stub('get', function(stub) {
          return stub.yields([
            { id: 222 }
          ], 200, function linkHeaders() {return ''});
        });
        stub = $http.stub('post', function(stub) {
          return stub.yields({}, 200);
        });
        board.id = 2;
        board.importCol = 1;
        provider = Provider(board, $http);
        provider.importRepoIssues({ id: 111, issues_url: "test" });
      });
      it("uses the correct URL", function() {
        expect(stub.getCall(0).args[0]).to.eq("/boards/2/columns/1/cards/import/github");
      });
      it("supplies an id field sufficient for uniqueness matching", function() {
        expect(stub.getCall(0).args[1].openIssues[0].id).to.eq(222);
      });
    });

    describe("with paginated issues", function() {
      beforeEach(function() {
        $http = helper.fake$http();
        $http.stub('get', function(stub) {
          return stub.yields([
            { id: 222 }
          ], 200, function linkHeaders() {
            return li.stringify({
              next: 'whatever'
            });
          });
        });
        stub = $http.stub('post', function(stub) {
          return stub.yields({}, 200);
        });
        board.id = 2;
        board.importCol = 1;
        provider = Provider(board, $http);
        provider.importRepoIssues({ id: 111, issues_url: "test" });
      });

      it("posts the issues to the backend in multiple calls", function() {
        expect(stub.callCount).to.eq(2);
      });
    });
  });
});

