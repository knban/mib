var helper = require('../test_helper'),
nock = require('nock'),
bcrypt = require('bcrypt'),
mongoose = helper.mongoose,
expect = helper.expect,
request = helper.supertest,
sinon = helper.sinon,
_ = helper._;


describe("Router", function() {
  var app = null,
  board = null,
  user = null,
  board_id = null,
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
    user = {
      token: 'userToken',
    }
    var userModal = new User({
      uid: "theusername",
      hash: bcrypt.hashSync("thepasswrd", 10),
      token: 'userToken',
      session: { misc: "data" }
    });
    userModal.save(function (err, _user) {
      if (err) throw err;
      user._id = _user.id;
      done(err, _user);
    });
  }

  function setupUserAndBoard(done) {
    setupUser(function (err, testuser) {
      user = testuser;
      createBoard({ name: 'my board' }, user.token, function (err, board) {
        board_id = board._id;
        done();
      });
    })
  };

  function reloadBoard(callback) {
    request(app)
    .get('/boards/'+board_id)
    .set('X-Auth-Token', user.token)
    .expect(200)
    .end(function (err, res) {
      if (err) throw err;
      board = res.body.board;
      callback();
    });
  };

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

      function mockGithub(withToken) {
        nock('https://api.github.com')
        .put('/authorizations/clients/'+process.env.GITHUB_CLIENT_ID)
        .reply(200, {
          token: withToken || 'ghtoken'
        })
      }

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
          mockGithub();
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
          mockGithub();
          loginViaGithub().end(function (err, res) {
            if (err) throw err;
            expect(res.body.token).to.be.ok;
            token = res.body.token;
            id = res.body._id;
            mockGithub();
            loginViaGithub().end(function (err, res) {
              if (err) throw err;
              expect(res.body._id).to.eq(id);
              expect(res.body.token).not.to.eq(token);
              done(); 
            });
          });
        });

        it("updates the github token", function(done) {
          var ghtoken = "firstToken";
          mockGithub(ghtoken);
          loginViaGithub().end(function (err, res) {
            if (err) throw err;
            request(app)
            .get('/session')
            .set('X-Auth-Token', res.body.token)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
              expect(res.body.authorizations.github.token).to.eq(ghtoken);
              ghtoken = "nextToken";
              mockGithub(ghtoken);
              loginViaGithub().end(function (err, res) {
                if (err) throw err;
                request(app)
                .get('/session')
                .set('X-Auth-Token', res.body.token)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                  if (err) throw err;
                  expect(res.body.authorizations.github.token).to.eq(ghtoken);
                  done();
                });
              })
            });
          });
        });
      });
    });
  });

  function createBoard(payload, token, done) {
    request(app)
    .post('/boards')
    .send(payload)
    .set('X-Auth-Token', token)
    .expect(201)
    .end(function(err, res) {
      if (err) throw err;
      board_id = res.body.board._id;
      expect(board_id).to.be.ok;
      done(err, res.body.board);
    });
  };

  describe("POST /boards", function () {
    it("rejects unauthorized users", function(done) {
      request(app)
      .post('/boards')
      .expect(401)
      .end(done);
    });

    it("returns the board id", function(done) {
      setupUser(function (err, user) {
        createBoard({name: 'my board'}, user.token, done)
      })
    });

    describe("Import JSON", function() {
      var json = null;

      beforeEach(function(done) {
        json = require('./../fixtures/import');
        setupUser(function (err, user) {
          createBoard({
            name: 'renamed board',
            jsonImport: json
          }, user.token, function (err, _board) {
            if (err) throw err;
            board_id = _board._id;
            reloadBoard(done);
          });
        });
      });

      it("takes the new name", function() {
        expect(board.name).to.eq('renamed board');
      });

      it("has the right # of columns", function() {
        expect(board.columns.length)
        .to.eq(json.columns.length);
      });

      describe("column #1", function() {
        var strip = function(c) {
          return _.omit(c, [
            '__v', '_id', 'cards', 'board'
          ]);
        };

        it("has the right # of cards", function() {
          expect(board.columns[0].cards.length)
          .to.eq(json.columns[0].cards.length);
        });

        it("resets authorized users", function() {
          expect(board.authorizedUsers).to.deep.eq([user._id.toString()]);
        });

        it("matches the imported column", function() {
          var jsonCol = strip(json.columns[0]);
          var col = strip(board.columns[0]);
          expect(jsonCol).to.deep.eq(col);
        });

        describe("card #1", function() {
          var strip = function(c) {
            return _.omit(c, [
              '__v', '_id', 'column'
            ]);
          };
          it("matches the imported card", function() {
            var jsonCard = strip(json.columns[0].cards[0]);
            var card = strip(board.columns[0].cards[0]);
            expect(jsonCard).to.deep.eq(card);
          });
        });
      });
    });
  });

  describe("GET /boards/:id", function () {
    beforeEach(setupUserAndBoard);

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
        expect(col.role).to.eq(1);
        expect(col.board).to.eq(board._id);
        expect(col.cards).to.have.length(0);

        col = board.columns[1];
        expect(col.name).to.eq('Backlog');
        expect(col.role).to.eq(0);
        expect(col.board).to.eq(board._id);
        expect(col.cards).to.have.length(0);

        col = board.columns[2];
        expect(col.name).to.eq('Doing');
        expect(col.role).to.eq(0);
        expect(col.board).to.eq(board._id);
        expect(col.cards).to.have.length(0);

        col = board.columns[3];
        expect(col.name).to.eq('Done');
        expect(col.role).to.eq(2);
        expect(col.board).to.eq(board._id);
        expect(col.cards).to.have.length(0);
        done();
      })
    });
  });

  describe("DELETE /boards/:id", function() {
    beforeEach(setupUserAndBoard);

    it("rejects unauthorized users", function(done) {
      request(app)
      .delete('/boards/'+board_id)
      .expect(401)
      .end(function () {
        request(app)
        .delete('/boards/'+board_id)
        .set('X-Auth-Token', "---")
        .expect(401)
        .end(done);
      });
    });

    it("deletes the board", function(done) {
      setupUser(function (err, user) {
        request(app)
        .delete('/boards/'+board_id)
        .set('X-Auth-Token', user.token)
        .expect(204)
        .end(function(err, res) {
          if (err) throw err;
          request(app)
          .get('/boards/'+board_id)
          .set('X-Auth-Token', user.token)
          .expect(404)
          .end(done);
        });
      })
    });
  });


  describe("GET /boards", function() {
    beforeEach(function(done) {
      setupUser(function (err, testuser) {
        user = testuser;
        createBoard({ name: '1' }, user.token, function () {
          createBoard({ name: '2' }, user.token, done);
        })
      })
    });

    it("rejects unauthorized users", function(done) {
      request(app)
      .get('/boards')
      .expect(401)
      .end(function () {
        request(app)
        .delete('/boards/'+board_id)
        .set('X-Auth-Token', "---")
        .expect(401)
        .end(done);
      });
    });

    it("returns authorized boards", function(done) {
      setupUser(function (err, user) {
        request(app)
        .get('/boards')
        .set('X-Auth-Token', user.token)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body.boards).to.have.length(2);
          done();
        });
      })
    });
  });

  describe("PUT /boards/:id/links/:provider", function() {
    beforeEach(setupUserAndBoard);

    it("rejects unauthorized users", function(done) {
      request(app)
      .put('/boards/'+board_id+'/links/github')
      .expect(401)
      .end(function () {
        request(app)
        .put('/boards/1/links/github')
        .set('X-Auth-Token', "---")
        .expect(401)
        .end(done);
      });
    });

    it("links multiple github repos", function(done) {
      var repo1 = { id: 123, stuff: "1"};
      var repo2 = { id: 234, stuff: "2"};
      request(app)
      .put('/boards/'+board_id+'/links/github')
      .set('X-Auth-Token', user.token)
      .send({ github: [ repo1, repo2 ] })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) throw err;
        request(app)
        .get('/boards/'+board_id)
        .set('X-Auth-Token', user.token)
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          var board = res.body.board;
          expect(Object.keys(board.links.github).length).to.eq(2);
          expect(board.links.github['123']).to.deep.eq(repo1);
          expect(board.links.github['234']).to.deep.eq(repo2);
          done();
        });
      });
    });
  });

  describe("POST /boards/:id/cards/:provider", function() {
    beforeEach(setupUserAndBoard);

    it("rejects unauthorized users", function(done) {
      request(app)
      .post('/boards/'+board_id+'/cards/github')
      .expect(401)
      .end(function () {
        request(app)
        .post('/boards/'+board_id+'/cards/github')
        .set('X-Auth-Token', "---")
        .expect(401)
        .end(done);
      });
    });

    it("adds the cards to the board and returns the new board", function(done) {
      var issue1 = { title: "foo", id: '123' };
      var issue2 = { title: "bar", id: '234' };
      request(app)
      .post('/boards/'+board_id+'/cards/github')
      .set('X-Auth-Token', user.token)
      .send({
        openIssues: [issue1, issue2],
        metadata: { repo_id: "1234" }
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) throw err;
        var cards = res.body.board.columns[0].cards;
        expect(cards).to.have.length(2);
        expect(cards[0].provider).to.eq('github');
        expect(cards[0].repo_id).to.eq('1234');
        expect(cards[0].remoteObject.title).to.be.ok;
        expect(cards[0].remoteObject.id).to.be.ok;
        expect(cards[1].provider).to.eq('github');
        expect(cards[1].repo_id).to.eq('1234');
        expect(cards[1].remoteObject.title).to.be.ok;
        expect(cards[1].remoteObject.id).to.be.ok;
        done();
      });
    });

    it("does not add cards that posess the same remote object id", function(done) {
      request(app)
      .post('/boards/'+board_id+'/cards/github')
      .set('X-Auth-Token', user.token)
      .send({
        openIssues: [{ title: "foo", id: '123' }],
        metadata: { repo_id: "1234" }
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) throw err;
        request(app)
        .post('/boards/'+board_id+'/cards/github')
        .send({
          openIssues: [
            { title: "qqq", id: '123' },
            { title: "bar", id: '234' },
            { title: "zzz", id: '345' }
          ],
          metadata: { repo_id: "1234" }
        })
        .set('X-Auth-Token', user.token)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          var cards = res.body.board.columns[0].cards;
          expect(cards).to.have.length(3);
          done();
        });
      });
    });
  });

  describe("PUT /boards/:id/cards/:card_id/move", function() {
    beforeEach(function (done) {
      setupUserAndBoard(function () {
        var issue1 = { title: "foo", id: '123' };
        var issue2 = { title: "bar", id: '234' };
        request(app)
        .post('/boards/'+board_id+'/cards/github')
        .set('X-Auth-Token', user.token)
        .send({
          openIssues: [{ test: "1" }, { test: "2" }, { test: "3" }, { test: "4" }],
          metadata: { repo_id: "1234" }
        }).end(function () {
          request(app)
          .get('/boards/'+board_id)
          .set('X-Auth-Token', user.token)
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;
            board = res.body.board;
            var column = res.body.board.columns[0];
            var cards = column.cards;
            expect(cards[0].remoteObject.test).to.eq('1')
            expect(cards[1].remoteObject.test).to.eq('2')
            expect(cards[2].remoteObject.test).to.eq('3')
            expect(cards[3].remoteObject.test).to.eq('4')
            done();
          });
        });
      });
    });

    it("rejects unauthorized users", function(done) {
      request(app)
      .put('/boards/'+board_id+'/cards/123/move')
      .expect(401)
      .end(function () {
        request(app)
        .put('/boards/'+board_id+'/cards/123/move')
        .set('X-Auth-Token', "---")
        .expect(401)
        .end(done);
      });
    });

    it("moves a card within a column", function(done) {
      var column = board.columns[0];
      var card = column.cards[2];
      request(app)
      .put('/boards/'+board._id+'/cards/'+card._id+'/move')
      .set('X-Auth-Token', user.token)
      .send({
        old_column: column._id,
        new_column: column._id,
        new_index: 1
      })
      .expect(204)
      .end(function(err, res){
        if (err) throw err;
        request(app)
        .get('/boards/'+board_id)
        .set('X-Auth-Token', user.token)
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          var cards = res.body.board.columns[0].cards;
          expect(cards).to.have.length(4);
          expect(cards[0].remoteObject.test).to.eq('1')
          expect(cards[1].remoteObject.test).to.eq('3')
          expect(cards[2].remoteObject.test).to.eq('2')
          expect(cards[3].remoteObject.test).to.eq('4')
          done();
        });
      });
    });

    it("moves a card from one column to another", function(done) {
      var column = board.columns[0];
      var column2 = board.columns[3];
      var card = column.cards[2];
      request(app)
      .put('/boards/'+board._id+'/cards/'+card._id+'/move')
      .set('X-Auth-Token', user.token)
      .send({
        old_column: column._id,
        new_column: column2._id,
        new_index: 1
      })
      .expect(204)
      .end(function(err, res){
        if (err) throw err;
        request(app)
        .get('/boards/'+board_id)
        .set('X-Auth-Token', user.token)
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          var cards = res.body.board.columns[0].cards;
          expect(cards).to.have.length(3);
          expect(cards[0].remoteObject.test).to.eq('1')
          expect(cards[1].remoteObject.test).to.eq('2')
          expect(cards[2].remoteObject.test).to.eq('4')
          cards = res.body.board.columns[3].cards;
          expect(cards).to.have.length(1);
          expect(cards[0].remoteObject.test).to.eq('3')
          done();
        });
      });
    });
  });

  describe("POST /boards/:id/:provider/:repo_id/webhook", function() {
    beforeEach(function(done) {
      setupUserAndBoard(function () {
        var issue1 = { title: "foo", id: '123' };
        var issue2 = { title: "bar", id: '234' };
        request(app)
        .post('/boards/'+board_id+'/cards/github')
        .set('X-Auth-Token', user.token)
        .send({
          openIssues: [{ test: "1" }, { test: "2" }, { test: "3" }, { test: "4" }],
          metadata: { repo_id: "1234" }
        }).end(function () {
          request(app)
          .get('/boards/'+board_id)
          .set('X-Auth-Token', user.token)
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;
            board = res.body.board;
            var column = res.body.board.columns[0];
            var cards = column.cards;
            expect(cards[0].remoteObject.test).to.eq('1')
            expect(cards[1].remoteObject.test).to.eq('2')
            expect(cards[2].remoteObject.test).to.eq('3')
            expect(cards[3].remoteObject.test).to.eq('4')
            done();
          });
        });
      });
    });

    describe("github", function() {
      describe("installed", function() {
        it("returns 204 No Content", function(done) {
          request(app)
          .post('/boards/'+board_id+'/github/1234/webhook')
          .expect(204)
          .end(done)
        });
      });

      function newIssueHookShot(callback) {
        request(app)
        .post('/boards/'+board_id+'/github/1234/webhook')
        .send(require('../fixtures/webhooks/github/00_new_issue_opened'))
        .expect(204)
        .end(function(err, res){
          if (err) throw err;
          callback();
        });
      };

      describe("issue opened", function() {
        beforeEach(function(done) {
          expect(board.columns[0].cards.length).to.eq(4);
          newIssueHookShot(function () {
            reloadBoard(done)
          });
        });

        it("creates a new card in the icebox", function(done) {
          expect(board.columns[0].cards.length).to.eq(5);
          var card = board.columns[0].cards[4];
          expect(card.remoteObject.title).to.eq('this is the title');
          expect(card.repo_id).to.eq('1234');
          expect(card.provider).to.eq('github');
          done();
        });
      });

      describe("issue comment", function() {
        beforeEach(function(done) {
          expect(board.columns[0].cards.length).to.eq(4);
          newIssueHookShot(function () {
            reloadBoard(done)
          });
        });

        function issueCommentHookShot(callback) {
          request(app)
          .post('/boards/'+board_id+'/github/1234/webhook')
          .send(require('../fixtures/webhooks/github/01_issue_commented_upon'))
          .expect(204)
          .end(function(err, res){
            if (err) throw err;
            callback();
          });
        };

        it("updates the existing card", function(done) {
          expect(board.columns[0].cards.length).to.eq(5);
          var newCard = board.columns[0].cards[4];
          expect(newCard.remoteObject.comments).to.eq(0);
          issueCommentHookShot(function() {
            reloadBoard(function () {
              expect(board.columns[0].cards.length).to.eq(5);
              var updatedCard = board.columns[0].cards[4];
              expect(updatedCard.remoteObject.comments).to.eq(1);
              done();
            })
          });
        });
      });

      describe("issue closed", function() {
        beforeEach(function(done) {
          expect(board.columns[0].cards.length).to.eq(4);
          newIssueHookShot(function () {
            reloadBoard(done)
          });
        });

        function issueCloseHookShot(callback) {
          request(app)
          .post('/boards/'+board_id+'/github/1234/webhook')
          .send(require('../fixtures/webhooks/github/03_issue_comment_and_close'))
          .expect(204)
          .end(function(err, res){
            if (err) throw err;
            callback();
          });
        };

        it("moves the card to done", function(done){
          expect(board.columns[0].cards.length).to.eq(5);
          var newCard = board.columns[0].cards[4];
          expect(newCard.remoteObject.comments).to.eq(0);
          issueCloseHookShot(function() {
            reloadBoard(function () {
              expect(board.columns[0].cards.length).to.eq(4);
              expect(board.columns[3].cards.length).to.eq(1);
              var updatedCard = board.columns[3].cards[0];
              expect(updatedCard.remoteObject.state).to.eq("closed");
              done();
            })
          });
        })
      });
    });
  });
});
