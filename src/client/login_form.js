function LoginForm(opts) {
  var $http = opts.$http;
  var close = opts.close;
  this.provider = "github";

  this.submit = function () {
    if (! this.uid || ! this.pw) return;
    else if (this.provider !== 'github') {
      alert("Currently only github login is supported");
    } else {
      this.busy = true;
      try {
        var self = this;
        /*
         * POST /sessions/:provider
         */
        $http.post(api.route('session'), {
          provider: this.provider,
          uid: this.uid,
          pw: this.pw
        }).success(function (data, status, headers, config) {
          console.log(arguments);
        }).success(function () {
          // do stuff...
          close();
        }).error(function (err) {
          console.error(err);
          self.busy = false;
        });
      } finally {
        pw = null;
      }
    }
  };
};

module.exports = LoginForm;
