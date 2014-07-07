var helper = require('../test_helper'),
sinon = helper.sinon,
expect = helper.expect;

var BoardController = helper.require('client/controllers/board_controller');
var Provider = helper.require('providers/github').cardProvider;

var li = require('li');

var Endpoint = require('../../src/client/endpoint');

describe("GitHub Provider", function() {
  var board = null,
  linker    = null,
  provider  = null,
  $api      = null,
  $github   = null,
  root      = null,
  github    = null,
  api       = null,
  request   = null;

  beforeEach(function() {
    root = "https://example.com/";
    board = { _id: "1" };
    linker = {};

    $api = sinon.stub();
    $api.returns({
      success: sinon.stub().returns({
        error: sinon.stub()
      })
    })

    $github = sinon.stub();
    $github.returns({
      success: sinon.stub().returns({
        error: sinon.stub()
      })
    })

    api = new Endpoint();
    api.setRoot(root);
    api.setClient('angular', $api, {
      headers: { 'X-Auth-Token': 'apptoken' }
    });

    github = new Endpoint();
    github.setRoot('https://api.github.com/');
    github.setClient('angular', $github, {
      headers: { 'Authorization': 'token ghtoken' }
    });

    provider = Provider({ attributes: board }, api, github, linker);
    provider.next();
  });

  it("fetches user data from github", function() {
    request = $github.getCall(0).args[0];
    expect(request.url).to.eq('https://api.github.com/user');
    expect(request.headers['Authorization']).to.eq('token ghtoken');
  });

  describe("installWebhook", function() {
    var hook = null;
    
    var repo = { id: 123, hooks_url: "hooks" }
    beforeEach(function() {
      provider.installWebhook(repo, function () {})
      request = $github.getCall(1).args[0];
      hook = $github.getCall(1).args[0].data;
    });
    it("sends the user token correctly", function() {
      expect(request.headers['Authorization']).to.eq('token ghtoken');
    });
    it("adds a webhook correctly", function() {
      expect(request.url).to.eq('https://api.github.com/hooks');
      expect(hook.name).to.eq("web");
      expect(hook.active).to.eq(true);
      expect(hook.events).to.include("issues");
      expect(hook.events).to.include("issue_comment");
      expect(hook.config.url).to.eq(root+"boards/"+board._id+"/github/123/webhook");
      expect(hook.config.content_type).to.eq("json");
    });
  });

  describe("getRepos without pagination", function() {
    beforeEach(function() {
      $github.returns({
        success: sinon.stub().yields([
          { name: "repo1" }, { name: "repo2" }, { name: "repo3" }
        ], 200, function linkHeaders() { return '' })
      })
      provider.getRepos('url');
    });
    it("populates linker._Repos with 3 repos", function() {
      expect(linker._Repos.length).to.eq(3);
    });
  });

  describe("postIssues", function() {
    beforeEach(function() {
      provider.postIssues([ {my:'issue'} ], { meta: 'data' });
    });
    it("posts issues to the api correctly", function() {
      expect($api.getCall(0).args[0]).to.deep.eq(
        { method: 'POST',
          url: 'https://example.com/boards/1/cards/github',
          data: { metadata: { meta: 'data' }, openIssues: [ { "my": "issue" } ] },
          headers: { 'X-Auth-Token': 'apptoken' } } )
    });
  });

  describe("importRepoIssues", function() {
    describe("issues not paginated", function() {
      beforeEach(function(done) {
        $github.returns({
          success: sinon.stub().yields([
            { _id: 222 }
          ], 200, function linkHeaders() { return '' }).returns({
            error: sinon.stub()
          })
        })
        board._id = 2;
        provider.importRepoIssues({ id: 111, issues_url: "test" }, function () {
          request = $api.getCall(0).args[0];
          done();
        });
      });
      it("posts the issues to the backend in a single call", function() {
        expect($api.callCount).to.eq(1);
      });
      it("POSTs data to the correct URL", function() {
        expect(request.url).to.eq("https://example.com/boards/2/cards/github");
        expect(request.method).to.eq("POST");
        expect(request.data).to.be.ok;
      });
      it("supplies an id field sufficient for uniqueness matching", function() {
        expect(request.data.openIssues[0]._id).to.eq(222);
      });
    });

    describe("with paginated issues", function() {
      beforeEach(function(done) {
        $github.returns({
          success: sinon.stub().yields([
            { _id: 222 }
          ], 200, function linkHeaders() {
            $github.returns({ 
              success: sinon.stub().yields([
                { id: 333 }
              ], 200, function() {}).returns({
                error: sinon.stub()
              })
            });
            return li.stringify({
              next: 'whatever'
            });
          }).returns({
            error: sinon.stub()
          })
        })
        board._id = 2;
        provider.importRepoIssues({ id: 111, issues_url: "test" }, function () {
          request = $api.getCall(0).args[0];
          done();
        });
        board.id = 2;
        provider.importRepoIssues({ id: 111, issues_url: "test" }, function () {
          done();
        });
      });

      it("posts the issues to the backend in multiple calls", function() {
        expect($api.callCount).to.eq(2);
      });
    });
  });
});

