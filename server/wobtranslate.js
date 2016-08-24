/* MAIN NODE APP */

/* Load required modules.
 * http is used to create the server
 * express is used to make things easier
 */
var http = require('http');
var express = require('express');
var app = express();

/* Load validator so we can validate arguments server-side */
var wobvalidator = require('./wobvalidator.js');
var translateValidator = wobvalidator.translateValidator,
    sentenceValidator = wobvalidator.sentenceValidator;

/* Common Request and Promise objects */
var Request = require('../base/node-request-wrapper.js').Request;
var Promise = require('promise');

/* Create glosbe wrapper using node.js's versions of Request and Promise */
var GlosbeWrapper = require('../api/glosbe-wrapper.js').Wrapper;
var Glosbe = new GlosbeWrapper(Request, Promise);

/* Create bing wrapper likewise */
var BingWrapper = require('../api/bing-wrapper.js').Wrapper;
var parseString = require('xml2js').parseString;
var config = require('./config.js');
var Bing = new BingWrapper(Request, Promise, parseString, config.clientID, config.clientSecret);

app.all('/', function (request, response) {
  response.send("Welcome to wobtranslate!");
});

app.get('/translate', function (request, response) {
  console.log("translate hit!");
  var args = request.query;
  var error = translateValidator.rejects(args);
  if (error) {
    response.status(400).send(error);
    return;
  }
  var glosbe = Glosbe.translate({
    to: args.to,
    from: args.from,
    phrase: args.phrase
  });

  //Send request through both wrappers, eventually
  var bing = Bing.translate({
    to: args.to,
    from: args.from,
    phrase: args.phrase,
  }).then(function (value) {
    //Wrap bing result in an array
    return [value];
  });

  Promise.any([ bing, glosbe ]).then(function (values) {
    var results = [];
    var duplicates = {};
    for (var i = 0; i < values.length; i++) {
      for (var j = 0; j < values[i].length; j++) {
        var value = values[i][j];
        if (!duplicates[value.translation]) {
          duplicates[value.translation] = true;
          results.push(value);
        }
      }
    }
    response.json(results);
  }).catch(function (errors) {
    response.json([]);
  });
});

app.get('/sentence', function (request, response) {
  var args = request.query;
  var error = sentenceValidator.rejects(args);
  if (error) {
    response.status(400).send("Example sentences do not work with detecting language.");
  } else {
    Glosbe.sentence({
      to: args.to,
      from: args.from,
      phrase: args.phrase
    }).then(function (array) {
      response.json(array);
    }).catch(function (error) {
      response.json([]);
    });
  }
});

http.createServer(app).listen(8000);

//Return array of results of those promises that succeeded.
//Otherwise, returns array of all errors
Promise.any = function (promises) {
  var resolved = promises.map(function (promise) {
    return promise.then(function (result) {
      return { result: result, success: true }
    }).catch(function (error) {
      return { result: error, success: false };
    });
  });

  return Promise.all(resolved).then(function (values) {
    var successes = [], failures = [];
    for (var i = 0; i < values.length; i++) {
      if (values[i].success) {
        successes.push(values[i].result);
      } else {
        failures.push(values[i].result);
      }
    }
    if (successes.length) {
      return successes;
    } else {
      throw failures;
    }
  });
}
