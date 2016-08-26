'use strict';
var Glosbe = require('./glosbeapi.js').Glosbe;
var timeout = 5000; //Give up after 5 seconds

exports.Wrapper = function (Request, Promise) {
  var GAPI = new Glosbe(Request, Promise);
  /*
   * ARGUMENTS:
   *  from   (string) ISO Code of language to translate from
   *  to     (string) ISO Code of language to translate to
   *  phrase (string) Phrase to translate from `from` to `to`
   * RETURNS:
   *  PROMISE that, on success, returns result of calling glosbeTranslateToArray
   *    on responses from Glosbe server with the following requests:
   *      - Phrase with case as provided
   *      - Phrase in all lowercase
   *  This is because glosbe is case-sensitive
   */
  this.translate = function (x) {
    if (!x) {
      return Promise.reject("The value passed to the translate wrapper was " + x + ".");
    }
    var promises = [];
    var promiseProvidedCase = GAPI.translate({
      from: x.from,
      dest: x.to,
      phrase: x.phrase,
      format: 'json',
    }).setOptions({
      timeout: timeout
    }).get();
    promises.push(promiseProvidedCase);

    //Add an additional promise with x.phrase in lowercase, if possible
    if (isString(x.phrase)) {
      var lower = x.phrase.toLowerCase();
      if (x.phrase !== lower) {
        var promiseLowerCase = GAPI.translate({
          from: x.from,
          dest: x.to,
          phrase: lower,
          format: 'json',
        }).setOptions({
          timeout: timeout
        }).get();
        promises.push(promiseLowerCase);
      }
    }

    return Promise.all(promises).then(function (values) {
      return flatmap(values, function (val) {
        var data = val.json;
        if (!data) {
          throw "Glosbe server returned unexpected result.";
        }
        return glosbeTranslateJsonToArray(data);
      });
    });
  }

  /*
   * ARGUMENTS:
   *  from    (string) ISO Code of language to translate from
   *  to      (string) ISO Code of language to translate to
   *  phrase  (string) Phrase to translate from `from` to `to`
   *  page    (int)    Page number of results to return. Ranges from 1-7, and
   *                    if no results are returned for x, none will be returned
   *                    for y >= x.
   * RETURNS:
   *  PROMISE that, on success, returns result of calling glosbeTMToArray
   *    on response from Glosbe server with the following requests:
   *    - Phrase with case as provided
   *    - Phrase in all lowercase
   *  This is because glosbe is case-sensitive
   */
  this.sentence = function (x) {
    if (!x) {
      return Promise.reject("The value passed to the translate wrapper was invalid.");
    }
    var promises = [];
    var promiseProvidedCase = GAPI.tm({
      from: x.from,
        dest: x.to,
        phrase: x.phrase,
        format: 'json',
    }).setOptions({
      timeout: timeout
    }).get();
    promises.push(promiseProvidedCase);

    if (isString(x.phrase)) {
      var lower = x.phrase.toLowerCase();
      if (lower !== x.phrase) {
        var promiseLowerCase = GAPI.tm({
          from: x.from,
          dest: x.to,
          phrase: lower,
          format: 'json',
        }).setOptions({
          timeout: timeout
        }).get();
        promises.push(promiseLowerCase);
      }
    }

    return Promise.all(promises).then(function (values) {
      return flatmap(values, function (val) {
        var data = val.json;
        if (!data) {
          throw "Glosbe server returned unexpected result.";
        }
        return glosbeTMJsonToArray(data);
      });
    });
  }
}

/*
 * REQUIRES: data is an object that is in the expected format from a Glosbe
 *   response to a translate request.
 * RETURNS:
 *  Array whose elements have properties:
 *    translation   (string)       Text of the translation in `to`
 *    source        (string)       Source of translation (glosbe)
 *    authors       (object array) array of objects having properties
 *      url           (string) URL of source on glosbe
 *      id            (int)    unique author id on glosbe
 */
function glosbeTranslateJsonToArray(data) {
  /* The following extractions are dependent on the setup of Glosbe's
   * API and are subject to change. Run test-glosbe.js to verify that
   * Glosbe is, in general, returning the expected format of data.
   */

  //Retrieve authors information in a list to association attribution info
  var keys = Object.keys(data.authors);
  var allAuthors = keys.map(function (key) {
    var author = data.authors[key];
    return {
      id: author.id,
      url: author.url
    };
  });

  //Extract translations and associate to author
  return mapfilter(data.tuc, function (tucElement) {
    if (!tucElement.phrase) return undefined; //Get bad data out!
    var authors = mapfilter(tucElement.authors, function (id) {
      return linearSearch(allAuthors, function (a) { return a.id === id; });
    });
    return {
      translation: tucElement.phrase.text,
      source: "glosbe",
      authors: authors
    }
  });
}

/*
 * REQUIRES: data is an object that is in the expected format from a Glosbe
 *  response to a tm request.
 * RETURNS:
 *  Array whose elements have properties:
 *    toSentence   (string) Sentence containing `phrase` in `to` language
 *    fromSentence (string) Sentence containing `phrase` in `from` language
 *    author       (object) object having properties
 *      url          (string) URL of source on glosbe
 *      id           (int)    unique author id on glosbe
 */
function glosbeTMJsonToArray(data) {
  //Again, this is dependent on the format of Glosbe data
  return data.examples.map(function (example) {
    return {
      fromSentence: example.first,
      toSentence: example.second,
      author: {
        id: example.author,
        url: "https://www.glosbe.com/source/" + example.author
      }
    }
  });
}

/* REQUIRES: predicate returns a value for all elements of A
 * RETURNS: the first element of A satisfying predicate, otherwise returns
 *  undefined.
 */
function linearSearch(A, predicate) {
  for (var i = 0; i < A.length; i++) {
    if (predicate(A[i])) {
      return A[i];
    }
  }
}

/* REQUIRES: predicate/map return values for all elements of A
 * RETURNS: After map is applied, those elements satisfying predicate
 * are kept. If no predicate is provided, truthy values are kept.
 */
function mapfilter(A, map, predicate) {
  if (!predicate) {
    predicate = function (x) { return x; };
  }
  var result = [];
  for (var i = 0; i < A.length; i++) {
    var y = map(A[i]);
    if (predicate(y)) {
      result.push(y);
    }
  }
  return result;
}

/* REQUIRES: A is an array, map returns an array for all A[i]
 * RETURNS: The flattened version of applying map to all A[i]
 */
function flatmap(A, map) {
  var result = [];
  for (var i = 0; i < A.length; i++) {
    var B = map(A[i]);
    for (var j = 0; j < B.length; j++) {
      result.push(B[j]);
    }
  }
  return result;
}

/* Returns whether x is a string */
function isString(x) {
  return typeof x === "string" || x instanceof String;
}
