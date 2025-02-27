var assert = require('assert');
describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

let besuClique = require('../dist/index.js');
describe('checkDocker', function () {
  it('should return a string', function () {
    assert.equal(besuClique.getVersion(), true);
  });
});