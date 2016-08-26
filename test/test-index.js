var { Glosbe } = require('../api/glosbeapi.js');
var { Request } = require('../base/xhr-wrapper.js');
var GAPI = new Glosbe(Request, Promise);

/*****************************************
 * Tests for validation of inputs to API *
 *****************************************/
exports["test GAPI undefined"] = function(assert, done) {
  GAPI.translate().get()
    .then(function () {
        assert.ok(false, "Should have raised validation error");
        done();
  }).catch(function (error) {
        assert.ok(true, "Properly raised error: " + error);
        done();
  });
}

exports["test GAPI empty"] = function(assert, done) {
  GAPI.translate({}).get().then(function () {
    assert.ok(false, "Should have raised validation error");
    done();
  }).catch(function (error) {
    assert.ok(true, "Properly raised error: " + error);
    done();
  });
}

exports["test GAPI missing"] = function(assert, done) {
  GAPI.translate({
    from: 'eng',
    phrase: 'God bless you Ms. Rosewater'
  }).get().then(function () {
    assert.ok(false, "Should have raised validation error");
    done();
  }).catch(function (error) {
    assert.ok(true, "Properly raised error: " + error);
    done();
  });
}

exports["test GAPI optional"] = function(assert, done) {
  GAPI.translate({
    from: 'eng',
    dest: 'spa',
    phrase: 'God bless you Ms. Rosewater',
    format: 'json',
    tm: 'yes'
  }).get().then(function () {
    assert.ok(false, "Should have raised validation error");
    done();
  }).catch(function (error) {
    assert.ok(true, "Properly raised error: " + error);
    done();
  });
}

exports["test GAPI nooptional"] = function(assert, done) {
  GAPI.translate({
    from: 'eng',
    dest: 'spa',
    phrase: 'God bless you Ms. Rosewater',
    format: 'json',
  }).get().then(function (result) {
    assert.ok(true, "Returned result: " + result.json)
    done();
  }).catch(function (error) {
    assert.ok(false, "Should not have raised error: " + error);
    done();
  });
}

require("sdk/test").run(exports);
