var helper = require('../test_helper'),
bcrypt = require('bcrypt'),
mongoose = helper.mongoose,
expect = helper.expect,
request = helper.supertest,
sinon = helper.sinon;


describe("Router", function() {
  var app = null,
  board = null,
  User = null,
  Board = null; 

  beforeEach(function() {
    /*
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
      }],
      links: {}
    };

    helper.stubModel('Board').returns({
      find: sinon.stub().yields(null, [board]),
      findById: sinon.stub().yields(null, board),
      update: sinon.stub().yields(null)
    });

    app = helper.appWithRouter('server/router');

    Board = helper.require('server/models/board');
    */
  })

  beforeEach(function(done) {
    mongoose.models = {};
    mongoose.modelSchemas = {};
    mongoose.connect(helper.mongoDB, function () {
      app = helper.appWithRouter('server/router');
      User = mongoose.model('User');
      done();                                                  
    })
  });

  afterEach(function(done) {
    mongoose.connection.db.dropDatabase(function (err) {
      mongoose.disconnect(done);
    });
  });

  function setupUser(done) {
    var user = new User({
      uid: "theusername",
      hash: bcrypt.hashSync("thepasswrd", 10),
      token: 'userToken',
      session: { misc: "data" }
    });
    user.save(function (err) {
      if (err) throw err;
      done(err, user);
    });
  }

  describe("GET /session", function () {
    it("rejects unauthorized users", function(done) {
      request(app)
      .get('/session')
      .expect(401)
      .end(done);
    });

    it("returns the user's session", function(done) {
      setupUser(function (err, user) {
        request(app)
        .get('/session')
        .set('X-Auth-Token', user.token)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          expect(res.body.session.misc).to.eq('data');
          done(err);
        });
      });
    });
  });

  describe("POST /session", function () {
    it("rejects invalid credentials", function(done) {
      setupUser(function (err, user) {
        request(app)
        .post('/session')
        .send({
          provider: "local",
          uid: user.uid,
          pw: "ssaawraaad"
        })
        .expect(401)
        .end(done);
      });
    });

    it("returns a new auth token", function(done) {
      setupUser(function (err, user) {
        request(app)
        .post('/session')
        .send({
          provider: "local",
          uid: user.uid,
          pw: "thepasswrd"
        })
        .expect(201)
        .end(function (err, res) {
          expect(res.body.token).not.to.eq('userToken');
          console.log(res.body);
          expect(res.body.token).to.be.ok;
          done(err); 
        });
      });
    });
  });

  describe("POST /boards", function () {
    it("rejects unauthorized users", function(done) {
      request(app)
      .post('/boards')
      .expect(401)
      .end(done);
    });

    it("creates an empty board", function(done) {
      request(app)
      .post('/boards')
      .send({

      })
      .set('X-Auth-Token', 'mytoken')
      .expect(201)
      .end(function(err, res) {
        if (err) throw err;
        done();
      });
    });
  });


  describe.skip("Github", function() {

    describe("Linking Repos", function() {
      describe("POST /boards/:id/links/github", function() {
        it("links multiple repos", function(done) {
          var repo1 = { id: 123, stuff: "1"};
          var repo2 = { id: 234, stuff: "2"};
          request(app)
          .put('/boards/1/links/github')
          .send({
            github: [
              repo1,
              repo2
            ]
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res){
            if (err) throw err;
            expect(Object.keys(board.links.github).length).to.eq(2);
            expect(board.links.github['123']).to.deep.eq(repo1);
            expect(board.links.github['234']).to.deep.eq(repo2);
            expect(Board.update.callCount).to.eq(1);
            done();
          });
        });
      });
    });

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
