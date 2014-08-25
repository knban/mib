var helper = require('../test_helper'),
expect = helper.expect;

var Dropzone = require('../../src/client/dropzone');

describe.skip("Dropzone", function() {
  var dz1 = dz2 = dz3 = null;

  beforeEach(function(done) {
    helper.createDOM(function (window) {
      console.log('111', window.$('body'));
      dz1 = new Dropzone({ column: {} })
      dz2 = new Dropzone({ column: {} })
      dz3 = new Dropzone({ column: {} })
      done();
    })
  });

  it("", function() {
    dz1.start({ item: "" })
  });

});
