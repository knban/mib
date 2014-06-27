var helper = require('../test_helper'),
expect = helper.expect;

var BoardController = helper.require('client/controllers/board_controller');
var Provider = helper.require('providers/github').cardProvider;

var li = require('li');

describe("GitHub Provider", function() {
  var board = null;
  var provider = null;
  var $http = null;

  beforeEach(function() {
    $http = helper.fake$http();
    board = new BoardController[BoardController.length-1]($http);
    board.model = {
      id: "1"
    };
  });

  describe("installWebhook", function() {
    var hook = null;
    var origin = "https://example.com";
    beforeEach(function() {
      $http.stub('post', function(stub) {});
      global.window = { location: { origin: origin } };
      provider = Provider(board, $http);
      provider.installWebhook({ hooks_url: "hooks" });
      hook = $http.post.getCall(0).args[1];
    });
    it("adds a webhook correctly", function() {
      expect($http.post.callCount).to.eq(1);
      expect($http.post.getCall(0).args[0]).to.eq("hooks");
      expect(hook.name).to.eq("web");
      expect(hook.active).to.eq(true);
      expect(hook.events).to.include("issues");
      expect(hook.events).to.include("issue_comment");
      expect(hook.config.url).to.eq(origin+"/boards/"+board.model.id+"/webhooks/github");
      expect(hook.config.content_type).to.eq("json");
    });
  });

  describe("getRepos without pagination", function() {
    beforeEach(function() {
      $http.stub('get', function(stub) {
        return stub.yields([
          { name: "repo1" }, { name: "repo2" }, { name: "repo3" }
        ], 200, function linkHeaders() {return ''});
      });
      provider = Provider(board, $http);
      provider.getRepos('url');
    });
    it("populates board.projectLinker._Repos with 3 repos", function() {
      expect(board.projectLinker._Repos.length).to.eq(3);
    });
    it("board.projectLinker._ReposLinks is null", function() {
      expect(board.projectLinker._ReposLinks).to.eq(null);
    });
  });

  describe("getRepos with pagination", function() {
    beforeEach(function() {
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
    it("populates board.projectLinker._Repos with 3 repos", function() {
      expect(board.projectLinker._Repos.length).to.eq(3);
    });
    it("it sets board.projectLinker._ReposLinks with the parsed links object", function() {
      expect(board.projectLinker._ReposLinks).to.deep.eq({
        next: 'link1',
        last: 'link2'
      });
    });
  });

  describe("importRepoIssues", function() {
    var stub = null;

    describe("issues not paginated", function() {
      beforeEach(function() {
        $http.stub('get', function(stub) {
          return stub.yields([
            { id: 222 }
          ], 200, function linkHeaders() {return ''});
        });
        stub = $http.stub('post', function(stub) {
          return stub.yields({}, 200);
        });
        board.id = 2;
        board.projectLinker._Col = 1;
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
        $http.stub('get', function(stub) {
          return stub.yields([
            { id: 222 }
          ], 200, function linkHeaders() {
            $http.restub('get', function(stub) {
              return stub.yields([ { id: 333 } ], 200, function(){});
            });
            return li.stringify({
              next: 'whatever'
            });
          });
        });
        stub = $http.stub('post', function(stub) {
          return stub.yields({}, 200);
        });
        board.id = 2;
        board.projectLinker._Col = 1;
        provider = Provider(board, $http);
        provider.importRepoIssues({ id: 111, issues_url: "test" });
      });

      it("posts the issues to the backend in multiple calls", function() {
        expect(stub.callCount).to.eq(2);
      });
    });
  });
});

