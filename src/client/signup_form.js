function SignupForm(session) {
  var form = this;

  this.submit = function () {
    form.busy = true;
    form.errors = null;
    if (! this.email) {
      form.errors = "please enter a valid email address"
      form.busy = false;
    } else if (! this.password || this.password.length < 6) {
      form.errors = "please enter a password of at least 6 characters"
      form.busy = false;
    } else if (this.password !== this.password_confirmation) {
      form.errors = "password does not match confirmation"
      form.busy = false;
    } else {
      /*
       * POST /users
       */
      api.post('users', {
        uid: form.email,
        email: form.email,
        password: form.password
      }).success(function (data, status, headers, config) {
        localStorage.token = data.token;
        session.load();
      }).error(function (err) {
        form.errors = err.toString();
        form.busy = false;
      });
    }
  };
};

module.exports = SignupForm;
