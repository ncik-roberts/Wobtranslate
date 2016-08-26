'use strict';
var Bing = require('./bingapi.js').Bing;
var timeout = 5000; //Give up after 5 seconds

/* parseString is based off of Node.js's xml2js.
 * It is a function that takes in a string and a callback.
 * The callback takes two arguments: err, result.
 * err is a message detailing the failure to parse the xml element, result is the javascript object.
 */
exports.Wrapper = function (Request, Promise, parseString, clientID, clientSecret) {
  var BAPI = new Bing(Request, Promise, clientID, clientSecret);

  /*
   * ARGUMENTS:
   *  from   (string) ISO Code of language to translate from (optional)
   *  to     (string) ISO Code of language to translate to
   *  phrase (string) Phrase to translate from `from` to `to
   * RETURNS:
   *  PROMISE that, on success, returns an object with the following properties:
   *    translation (string)  Text of the translation in `to` language
   *    source      (string)  Source of translation (bing)
   *    authors     (object array) array of single object having properties
   *      url         (string)     https://www.microsoft.com/en-us/translator/translatorapi.aspx
   *
   * Now, you're probably wondering, why would we have an authors array with only one element?
   * The answer is, unsatisfyingly, to stay consistent with Glosbe.
   */
  this.translate = function (x) {
    if (!x) {
      return Promise.reject("The value passed to the translate wrapper was " + x + ".");
    }

    var to = x.to;
    if (to in languageCodeDict) {
      to = languageCodeDict[to];
    }

    var args = {
      to: to,
      text: x.phrase
    };

    if (x.from) {
      var from = x.from;
      if (from in languageCodeDict) {
        from = languageCodeDict[from];
      }
      args.from = from;
    }

    //Forced to call Promise.resolve because parseString is asynchronous
    var extractionPromise = BAPI.translate(args).setOptions({ timeout: timeout })
                               .get()
                               .then(extractTranslation);
    return Promise.resolve(extractionPromise);
  }

  function extractTranslation(response) {
    //This method is dependent on the response of Bing Translation API and is subject to change
    return new Promise(function (resolve, reject) {
      parseString(response.text, function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve({
            translation: result.string._,
            source: "bing",
            authors: [ { url: "https://www.microsoft.com/en-us/translator/translatorapi.aspx" } ]
          });
        }
      });
    });
  }

  //Map between glosbe codes and bing codes
  var languageCodeDict = {
    'cmn': 'zh-CHS',
    'rus': 'ru',
    'kor': 'ko',
    'jpn': 'ja',
  };
}

