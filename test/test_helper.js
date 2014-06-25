var chai = require('chai');
var sinon = require('sinon');
var mongoose = require('mongoose');
var _ = require('lodash');
var stubbedModels = [];
module.exports = {
  sinon: sinon,
  expect: chai.expect,
  /*
   * Stub a mongoose model with sinon
   */
  stubModel: function(modelName) {
    mongoose.model = sinon.stub();
    return mongoose.model.withArgs(modelName);
  },
  /*
   * Restore stubbed mongoose models
   */
  restoreModels: function(done) {
    _.each(stubbedModels, function(stub) {
      stub.restore();
    });
    done();
  },
  /*
   * Require source files relative to the src/ directory
   * */
  require: function(path) {
    return require('../src/'+path);
  },
  /*
   * Stub the angular $http service using sinon
   */
  fake$http: function(data, linkHeader) {
    return {
      get: sinon.stub().returns({
        success: sinon.stub().yields(data, 200, sinon.stub().returns(linkHeader || ''))
      })
    };
  }
}
