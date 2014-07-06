var helper = require('../test_helper'),
expect = helper.expect;

var BoardController = helper.require('client/controllers/board_controller');
var Provider = helper.require('providers/github').cardProvider;

var li = require('li');

var Endpoint = require('../../src/client/endpoint');

describe("GitHub Provider", function() {
  global.app = {};
  global.api = new Endpoint();
  global.api.setRoot('https://example.com/');
  var board = null;
  var provider = null;
  var $http = null;

  beforeEach(function() {
    $http = helper.fake$http();
    linker = new BoardController[BoardController.length-1]($http).projectLinker;
    board = {
      _id: "1"
    };
  });

  describe("installWebhook", function() {
    var hook = null;
    var origin = "https://example.com";
    var repo = { id: 123, hooks_url: "hooks" }
    beforeEach(function() {
      $http.stub('post', function(stub) {}).returns({
        success: function () {
          return {
            error:  function () {
              
            }
          }
        },
      });
      global.window = { location: { origin: origin } };
      provider = Provider(board, linker, $http);
      provider.installWebhook(repo, function () {})
      hook = $http.post.getCall(0).args[1];
    });
    it("adds a webhook correctly", function() {
      expect($http.post.callCount).to.eq(1);
      expect($http.post.getCall(0).args[0]).to.eq("hooks");
      expect(hook.name).to.eq("web");
      expect(hook.active).to.eq(true);
      expect(hook.events).to.include("issues");
      expect(hook.events).to.include("issue_comment");
      expect(hook.config.url).to.eq(origin+"/boards/"+board._id+"/github/123/webhook");
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
      provider = Provider(board, linker, $http);
      provider.getRepos('url');
    });
    it("populates linker._Repos with 3 repos", function() {
      expect(linker._Repos.length).to.eq(3);
    });
  });

  describe("importRepoIssues", function() {
    var stub = null;

    describe("issues not paginated", function() {
      beforeEach(function(done) {
        $http.stub('get', function(stub) {
          return stub.yields([
            { _id: 222 }
          ], 200, function linkHeaders() {return ''});
        });
        stub = $http.stub('post', function(stub) {
          return stub.yields({}, 200);
        });
        board._id = 2;
        linker._Col = 1;
        provider = Provider(board, linker, $http);
        provider.importRepoIssues({ id: 111, issues_url: "test" }, done);
      });
      it("uses the correct URL", function() {
        expect(stub.getCall(0).args[0]).to.eq("https://example.com/boards/2/cards/github");
      });
      it("supplies an id field sufficient for uniqueness matching", function() {
        expect(stub.getCall(0).args[1].openIssues[0]._id).to.eq(222);
      });
    });

    describe("with paginated issues", function() {
      beforeEach(function(done) {
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
        linker._Col = 1;
        provider = Provider(board, linker, $http);
        provider.importRepoIssues({ id: 111, issues_url: "test" }, function () {
          done();
        });
      });

      it("posts the issues to the backend in multiple calls", function() {
        expect(stub.callCount).to.eq(2);
      });
    });
  });
});

