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
          remoteObject: {
            title: "first",
            stuff: "stuff",
            id: 1
          }
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

  describe("Github", function() {

    describe("Importing Issues", function() {
      describe("POST /boards/:id/columns/:col/cards/import/github", function() {
        // TODO add provider.
        // TODO scope issue object under a key within the card
        it("adds the cards to the board and returns the new board", function(done) {
          var issue1 = { title: "foo", id: '123' };
          var issue2 = { title: "bar", id: '234' };
          var card1 = { remoteObject: issue1, provider: "github", repo_id: "1234" };
          var card2 = { remoteObject: issue2, provider: "github", repo_id: "1234" };
          request(app)
          .post('/boards/1/columns/0/cards/import/github')
          .send({
            openIssues: [issue1, issue2],
            metadata: { repo_id: "1234" }
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res){
            if (err) throw err;
            expect(res.body.board.columns[0].cards.length).to.eq(2);
            expect(res.body.board.columns[1].cards.length).to.eq(1);
            expect(res.body.board.columns[0].cards[0]).to.deep.eq(card1);
            expect(res.body.board.columns[0].cards[1]).to.deep.eq(card2);
            expect(Board.update.callCount).to.eq(1);
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
            expect(res.body.board.columns[1].cards[0].remoteObject).to.deep.eq({
              title: "new title", new_field: 'test', id: 1, stuff: "stuff"
            });
            expect(Board.update.callCount).to.eq(1);
            done();
          });
        });
      });
    });

    describe("Webhook installed", function() {
      it("sends 204 No Content", function(done) {
        request(app)
        .post('/boards/1/github/1234/webhook')
        .expect(204)
        .end(done)
      });
    });

    describe("Webhook: Github Issue Opened", function() {
      it("creates a new card in the icebox", function(done) {
        expect(board.columns[0].cards.length).to.eq(0);
        request(app)
        .post('/boards/1/github/1234/webhook')
        .send(require('../fixtures/webhooks/github/00_new_issue_opened'))
        .expect(204)
        .end(function(err, res){
          if (err) throw err;
          expect(board.columns[0].cards.length).to.eq(1);
          var newCard = board.columns[0].cards[0];
          expect(newCard.remoteObject.title).to.eq('this is the title');
          expect(newCard.repo_id).to.eq('1234');
          expect(newCard.provider).to.eq('github');
          expect(Board.update.callCount).to.eq(1);
          done();
        });
      });
    });

    describe("Webhook: Github Issue Comment", function() {
      it("updates the existing card", function(done) {
        expect(board.columns[0].cards.length).to.eq(0);
        request(app).post('/boards/1/github/1234/webhook')
        .send(require('../fixtures/webhooks/github/00_new_issue_opened'))
        .expect(204).end(function(err, res) {
          if (err) throw err;
          expect(board.columns[0].cards.length).to.eq(1);
          var newCard = board.columns[0].cards[0];
          expect(newCard.remoteObject.comments).to.eq(0);
          request(app)
          .post('/boards/1/github/1234/webhook')
          .send(require('../fixtures/webhooks/github/01_issue_commented_upon'))
          .expect(204)
          .end(function(err, res){
            if (err) throw err;
            expect(board.columns[0].cards.length).to.eq(1);
            var updatedCard = board.columns[0].cards[0];
            expect(updatedCard.remoteObject.comments).to.eq(1);
            expect(newCard.repo_id).to.eq('1234');
            expect(newCard.provider).to.eq('github');
            expect(Board.update.callCount).to.eq(2);
            done();
          });
        }.bind(this));
      });
    });
  });
});
