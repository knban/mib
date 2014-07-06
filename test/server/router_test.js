var helper = require('../test_helper'),
nock = require('nock'),
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

    describe("local auth provider", function() {
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
            if (err) throw err;
            expect(res.body.token).not.to.eq('userToken');
            expect(res.body.token).to.be.ok;
            done(); 
          });
        });
      });
    });

    describe("github auth provider", function() {
      function mockGithub() {
        nock('https://api.github.com')
        .put('/authorizations/clients/'+process.env.GITHUB_CLIENT_ID)
        .reply(200, {
          token: "ghtoken"
        });
      }

      beforeEach(mockGithub);

      function loginViaGithub() {
        return request(app)
        .post('/session')
        .send({
          provider: "github",
          uid: "whatever",
          pw: "muppets"
        })
        .expect(201)
      };

      describe("new user", function() {
        it("creates a new user with a token", function(done) {
          loginViaGithub().end(function (err, res) {
            if (err) throw err;
            expect(res.body.token).to.be.ok;
            done(); 
          });
        });
      });

      describe("existing user", function() {
        var token = null;
        var id = null;
        it("finds the existing user and resets the token", function(done) {
          loginViaGithub().end(function (err, res) {
            if (err) throw err;
            expect(res.body.token).to.be.ok;
            token = res.body.token;
            id = res.body._id;
            mockGithub();
            loginViaGithub().end(function (err, res) {
              if (err) throw err;
              expect(res.body._id).to.be.ok;
              expect(res.body._id).to.eq(id);
              expect(res.body.token).to.be.ok;
              expect(res.body.token).not.to.eq(token);
              done(); 
            });
          });
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

    describe("No Import Data", function() {
      it("returns the board id", function(done) {
        setupUser(function (err, user) {
          request(app)
          .post('/boards')
          .send({ name: "my board" })
          .set('X-Auth-Token', user.token)
          .expect(201)
          .end(function(err, res) {
            if (err) throw err;
            expect(res.body.board._id).to.be.ok;
            done();
          });
        })
      });
    });

    describe.skip("Import Data", function() {
      it("returns the board id", function(done) {
        setupUser(function (err, user) {
          request(app)
          .post('/boards')
          .send({ name: "my board" })
          .set('X-Auth-Token', user.token)
          .expect(201)
          .end(function(err, res) {
            if (err) throw err;
            expect(res.body.board._id).to.be.ok;
            done();
          });
        })
      });
    });
  });

  describe.only("GET /boards/:id", function () {
    var user = null,
    board_id = null;

    beforeEach(function(done) {
      setupUser(function (err, testuser) {
        user = testuser;
        request(app)
        .post('/boards')
        .send({ name: "my board" })
        .set('X-Auth-Token', user.token)
        .expect(201)
        .end(function(err, res) {
          if (err) throw err;
          board_id = res.body.board._id;
          expect(board_id).to.be.ok;
          done();
        });
      })
    });

    it("rejects unauthorized users", function(done) {
      request(app)
      .get('/boards/'+board_id)
      .expect(401)
      .end(function () {
        request(app)
        .get('/boards/'+board_id)
        .set('X-Auth-Token', "---")
        .expect(401)
        .end(done);
      });
    });

    it("returns the board", function(done) {
      request(app)
      .get('/boards/'+board_id)
      .set('X-Auth-Token', user.token)
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;
        var board = res.body.board;
        expect(board.authorizedUsers).to.deep.eq([user._id.toString()]);
        expect(board.name).to.eq("my board");
        expect(board.columns).to.have.length(4);

        var col = board.columns[0];
        expect(col.name).to.eq('Icebox');
        expect(col.role).to.eq(0);
        expect(col.board).to.eq(board._id);
        expect(col.cards).to.have.length(0);

        col = board.columns[1];
        expect(col.name).to.eq('Backlog');
        expect(col.role).to.be.undefined;
        expect(col.board).to.eq(board._id);
        expect(col.cards).to.have.length(0);

        col = board.columns[2];
        expect(col.name).to.eq('Doing');
        expect(col.role).to.be.undefined;
        expect(col.board).to.eq(board._id);
        expect(col.cards).to.have.length(0);

        col = board.columns[3];
        expect(col.name).to.eq('Done');
        expect(col.role).to.eq(1);
        expect(col.board).to.eq(board._id);
        expect(col.cards).to.have.length(0);
        done();
      })
    });
  })


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
