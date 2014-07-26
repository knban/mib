function LoginForm(session) {
  var form = this;

  this.submit = function () {
    form.errors = null;
    form.busy = true;
    if (! this.uid || ! this.pw) {
      form.errors = "please log in";
      form.busy = false;
    } else {
      try {
        api.post('session', {
          provider: 'local',
          uid: this.uid,
          pw: this.pw
        }).success(function (data, status, headers, config) {
          localStorage.token = data.token;
          session.load();
        }).error(function (err) {
          form.errors = err.toString();
          form.busy = false;
        });
      } finally {
        pw = null;
        form.busy = false;
      }
    }
  };
};

module.exports = LoginForm;
