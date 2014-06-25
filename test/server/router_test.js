var helper = require('../test_helper'),
expect = helper.expect,
sinon = helper.sinon;

var mongoose = require('mongoose');
mongoose.model = sinon.stub();
mongoose.model.withArgs('Board').returns('hi');
var router = helper.require('server/router');
var Board = helper.require('server/models/board');

describe("Router", function() {
  describe("", function() {
    it("does stuff", function() {
      
    });
  });
});
