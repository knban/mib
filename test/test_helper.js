process.env.GITHUB_CLIENT_ID = "stubs";
process.env.GITHUB_CLIENT_SECRET = "stubs";

require('simple-stacktrace')({
  root: require('path').resolve(__dirname, '..')
})

var chai = require('chai');
var sinon = require('sinon');
var mongoose = require('mongoose');
var _ = require('lodash');
var stubbedModels = [];
module.exports = {
  mongoDB: 'mongodb://localhost/mib-test',
  mongoose: mongoose,
  sinon: sinon,
  expect: chai.expect,
  supertest: require('supertest'),
  /*
   * Create an express app and use the
   * specified file as its router
   */
  appWithRouter: function(routerFile) {
    var app = require('express')();
    app.use(require('body-parser').json());
    app.use(this.require(routerFile));
    return app;
  },
  /*
   * Stub a mongoose model with sinon
   */
  stubModel: function(modelName) {
    var stub = sinon.stub(mongoose, 'model');
    stubbedModels.push(stub);
    return stub.withArgs(modelName);
  },
  /*
   * Restore stubbed mongoose models
   */
  restoreModels: function(done) {
    _.each(stubbedModels, function(stub) {
      stub.restore();
    });
    stubbedModels = [];
    done();
  },
  /*
   * Require source files relative to the src/ directory
   * Invalidates the cache automatically on require
   * */
  require: function(path) {
    require.uncache('../src/'+path);
    return require('../src/'+path);
  },
  /*
   * Stub the angular $http service using sinon
   *  $http.stub('post', function(stub) {
   *    return stub.yields({ some: "data" }, 200);
   *  });
   */
  fake$http: function() {
    return {
      stub: function(method, successCase) {
        if (! this[method]) this[method] = function(){};
        var stub = sinon.stub(this, method);
        stub.returns({
          success: successCase(sinon.stub().returns({
            error: sinon.stub()
          }))
        })
        return stub;
      },
      restub: function(method, successCase) {
        this[method].restore();
        this.stub(method, successCase);
      }
    };
  }
}

/**
 * Removes a module from the cache
 */
require.uncache = function (moduleName) {
    // Run over the cache looking for the files
    // loaded by the specified module name
    require.searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
    });
};

/**
 * Runs over the cache to search for all the cached
 * files
 */
require.searchCache = function (moduleName, callback) {
    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function run(mod) {
            // Go over each of the module's children and
            // run over it
            mod.children.forEach(function (child) {
                run(child);
            });

            // Call the specified callback providing the
            // found module
            callback(mod);
        })(mod);
    }
};
