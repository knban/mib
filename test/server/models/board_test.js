var helper = require('../../test_helper'),
mongoose = helper.mongoose,
expect = helper.expect,
sinon = helper.sinon;

describe('Board Model', function() {
  mongoose.models = {};
  mongoose.modelSchemas = {};
  var Board = require('../../../src/server/models/board');
  
  beforeEach(function(done) {
    mongoose.createConnection(helper.mongoDB);   
    done();                                                  
  });

  afterEach(function(done) {
    mongoose.disconnect(function () {
      done();
    });  
  });

  it('should create a new board without columns', function(done) {
    var board = new Board({ name: 'My Nice Board' });
    expect(board._id).to.be.ok;
    expect(board.columns.length).to.eq(0);
    done();
  });
});
