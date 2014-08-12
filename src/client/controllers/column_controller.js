module.exports = ['$http', function($http) {
  this.showOptions = function () {
    console.log('show', this.column);
  };

  this.hideOptions = function () {
    console.log('hide', this.column);
  };
}];
