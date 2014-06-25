var chai = require('chai');
var sinon = require('sinon');
module.exports = {
  sinon: sinon,
  require: function(path) {
    return require('../src/'+path);
  },
  expect: chai.expect,
  fake$http: function(data, linkHeader) {
    return {
      get: sinon.stub().returns({
        success: sinon.stub().yields(data, 200, sinon.stub().returns(linkHeader || ''))
      })
    };
  }
}
