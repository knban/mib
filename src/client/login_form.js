function LoginForm(opts) {
  var $http = opts.$http,
  close = opts.close;
  var form = this;

  this.submit = function () {
    form.busy = true;
    if (! this.uid || ! this.pw) {
      form.busy = false;
    } else {
      try {
        var self = this;
        console.log('go');
        /*
         * POST /sessions/:provider
         */
        api.post('session', {
          provider: this.provider,
          uid: this.uid,
          pw: this.pw
        }).success(function (data, status, headers, config) {
          localStorage.token = data.token;
          opts.reloadSession();
          close();
        }).error(function (err) {
          console.error(err);
          self.busy = false;
        });
      } finally {
        pw = null;
        form.busy = false;
      }
    }
  };
};

module.exports = LoginForm;
