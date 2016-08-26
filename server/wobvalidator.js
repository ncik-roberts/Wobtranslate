var Validator = require('../base/validator.js').Validator;

/* This validator is created in a separate file so it can be used in two places.
 * (1) To validate arguments client-side before sending them to the server.
 * (2) Server-side, to ensure that the arguments received are good ones
 */

var isNonEmptyString = function (s) {
  return (s + '').length > 0;
}

var isPositiveInt = function (x) {
  return (x | 0) === x && x > 0;
}

var isISOCode = function (s) {
  return /^\w*$/.test(s);
}

var translateValidator = new Validator({
  'require': {
    'to': Validator.validate(isISOCode, "Not a possible ISO 693-3 code"),
    'phrase': Validator.validate(isNonEmptyString, "Not a valid phrase to translate"), },
  'accept': {
    'from': Validator.validate(isISOCode, "Not a possible ISO 693-3 code"),
    'maxresults': Validator.validate(isPositiveInt, "Not a positive integer"),
  }
});

var sentenceValidator = new Validator({
  'require': {
    'to': Validator.validate(isISOCode, "Not a possible ISO 693-3 code"),
    'from': Validator.validate(isISOCode, "Not a possible ISO 693-3 code"),
    'phrase': Validator.validate(isNonEmptyString, "Not a valid phrase to translate"),
  },
  'accept': {
    'page': Validator.validate(isPositiveInt, "Not a positive integer")
  }
});

exports.translateValidator = translateValidator;
exports.sentenceValidator = sentenceValidator;
