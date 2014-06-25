var helper = require('../test_helper'),
expect = helper.expect,
sinon = helper.sinon;


describe("Router", function() {
  var router = null,
  Board = null;

  beforeEach(function() {
    helper.stubModel('Board').returns('hi');
    router = helper.require('server/router');
    Board = helper.require('server/models/board');
  });

  afterEach(helper.restoreModels);

  describe("", function() {
    it("does stuff", function() {
      
    });
  });
});
