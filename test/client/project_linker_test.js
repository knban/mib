var helper = require('../test_helper'),
expect = helper.expect;

var ProjectLinker = require('../../src/client/project_linker');


describe("Project Linker", function() {
  var board = null;
  var linker = null;

  describe("with a github provider", function () {
    beforeEach(function() {
      board = {
        providers: {
          github: {
            info: {
              name: "github"
            }
          }
        }
      };
      linker = new ProjectLinker(board, null);
    });

    it("has 1 provider", function() {
      expect(linker.providers).to.have.length(1);
    });

    it("adds a github card provider", function() {
      expect(linker.providers[0].info.name).to.eq('github');
    });
  })

  describe("open()", function() {
    it("sets isOpen to true", function() {
      linker.open();
      expect(linker.isOpen).to.be.true;
    });
  });

  describe("close()", function() {
    it("sets isOpen to false", function() {
      linker.close();
      expect(linker.isOpen).to.be.false;
    });
  });
});
