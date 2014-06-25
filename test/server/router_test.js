var helper = require('../test_helper'),
expect = helper.expect,
request = helper.supertest,
sinon = helper.sinon;


describe("Router", function() {
  var app = null,
  board = null,
  Board = null;

  beforeEach(function() {
    board = {
      name: "a board",
      columns: [{
        cards: []
      }, {
        cards: [{
          title: "first",
          stuff: "stuff",
          id: 1
        }]
      }]
    };

    helper.stubModel('Board').returns({
      find: sinon.stub().yields(null, [board]),
      update: sinon.stub().yields(null)
    });

    app = helper.appWithRouter('server/router');

    Board = helper.require('server/models/board');
  })

  afterEach(helper.restoreModels);

  describe("Github Issue Importer", function() {
    describe("POST /boards/:id/columns/:col/cards/import/github", function() {
      // TODO add provider.
      // TODO scope issue object under a key within the card
      it("adds the cards to the board and returns the new board", function(done) {
        var card1 = { title: "foo" };
        var card2 = { title: "bar" };
        request(app)
        .post('/boards/1/columns/0/cards/import/github')
        .send({
          openIssues: [card1, card2]
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          expect(res.body.board.columns[0].cards.length).to.eq(2);
          expect(res.body.board.columns[1].cards.length).to.eq(1);
          expect(res.body.board.columns[0].cards[0]).to.deep.eq(card1);
          expect(res.body.board.columns[0].cards[1]).to.deep.eq(card2);
          done();
        });
      });

      it("merges/updates cards with the same (issue) id instead of duplicating", function(done) {
        var issue = { title: "new title", new_field: 'test', id: 1 };
        request(app)
        .post('/boards/1/columns/0/cards/import/github')
        .send({
          openIssues: [issue]
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          expect(res.body.board.columns[0].cards.length).to.eq(0);
          expect(res.body.board.columns[1].cards.length).to.eq(1);
          expect(res.body.board.columns[1].cards[0]).to.deep.eq({
            title: "new title", new_field: 'test', id: 1, stuff: "stuff"
          });
          done();
        });
      });
    });
  });
});
