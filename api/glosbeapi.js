'use strict';
var API = require('../base/promiseapi.js').API;
var Validator = require('../base/validator.js').Validator;

/*
 * Translation API for finding example sentences in other languages
 * normal non-function properties.
 */
var Glosbe = function (Request, Promise) {
  var GAPI = new API('https://glosbe.com/gapi', Request, Promise);

  /* Series of helper functions that make validation easy */
  var isISOCode = function (s) {
    var asString = s + '';
    return 2 <= asString.length && asString.length <= 3 && asString.toLowerCase() === asString;
  }

  var isNonEmptyString = function (s) {
    return (s + '').length > 0;
  }

  var isBooleanString = function (bool) {
    var stringified = bool + '';
    return stringified === 'true' || stringified === 'false';
  }

  var isInteger = function (x) {
    return (x | 0) === x;
  }

  var isBetweenInclusive = function (lo, hi) {
    return function (n) {
      return isInteger(n) && lo <= n && n <= hi;
    };
  }

  var isPositiveInt = function (x) {
    return isInteger(x) && x > 0;
  }

  var isValidFormat = function (string) {
    return string === 'json' || string === 'jsonp' || string === 'xml';
  }

  /* Access mono- and bi-lingual dictionaries */
  this.translate = (function () {
    var argumentValidator = new Validator({
      'require': {
        'from': Validator.validate(isISOCode, "Not a possible ISO 693-3 code"),
        'dest': Validator.validate(isISOCode, "Not a possible ISO 693-3 code"),
        'phrase': Validator.validate(isNonEmptyString, "Not a valid phrase to translate"),
        'format': Validator.validate(isValidFormat, "Must be json, jsonp, or xml"),
      },
      'accept': {
        'tm': Validator.validate(isBooleanString, "Not true or false"),
      }
    });

    return function (args, options) {
      return GAPI.request('/translate', args, argumentValidator, options);
    };
  })();

  /* Get translation memory of many translations */
  this.tm = (function () {
    var argumentValidator = new Validator({
      'require': {
        'from': Validator.validate(isISOCode, "Not a possible ISO 693-3 code"),
        'dest': Validator.validate(isISOCode, "Not a possible ISO 693-3 code"),
        'phrase': Validator.validate(isNonEmptyString, "Not a valid phrase to translate"),
        'format': Validator.validate(isValidFormat, "Must be json, jsonp, or xml"),
      },
      'accept': {
        'page': Validator.validate(isPositiveInt, "Must be a valid positive int"),
        'pageSize': Validator.validate(isBetweenInclusive(1, 30), "Must be between 1 and 30"),
      }
    });

    return function (args, options) {
      return GAPI.request('/tm', args, argumentValidator, options);
    };
  })();

  /* Enrich Glosbe's data by adding a translation. Must have an API key. */
  this.addTranslation = (function () {
    var argumentValidator = new Validator({
      'require': {
        'lang1': Validator.validate(isISOCode, "Not a possible ISO 693-3 code"),
        'lang2': Validator.validate(isISOCode, "Not a possible ISO 693-3 code"),
        'phrase1': Validator.validate(isNonEmptyString, "Not a possible phrase to add"),
        'phrase2': Validator.validate(isNonEmptyString, "Not a possible translation"),
        'apiKey': Validator.validate(isNonEmptyString, "Not a possible api key"),
        'format': Validator.validate(isValidFormat, "Must be json, jsonp, or xml"),
      },
      'accept': {
        'meaning1': Validator.validate(isNonEmptyString, "Not an awfully informative meaning"),
        'meaning2': Validator.validate(isNonEmptyString, "Not an awfully informative meaning"),
      }
    });

    return function (args, options) {
      return GAPI.request('/addTranslation', args, argumentValidator, options);
    };
  })();
}

exports.Glosbe = Glosbe
