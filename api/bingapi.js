'use strict';
var API = require('../base/promiseapi.js').API;
var Validator = require('../base/validator.js').Validator;
var request = require('request');

/*
 * Translation API for finding machine-generated translations
 * of words and phrases. Example of when authorization is needed.
 */
var Bing = function (Request, Promise, clientID, clientSecret) {
  /* Bing requires authorization, so we create a promise based on our
   * ID and secret. Upon its resolution, we can use the access_token
   * to make requests to BAPI.
   */
  var authAPI = new API('https://datamarket.accesscontrol.windows.net/v2', Request, Promise);
  var args = {
    'grant_type': 'client_credentials',
    'client_id': clientID,
    'client_secret': encodeURIComponent(clientSecret),
    'scope': 'http://api.microsofttranslator.com'
  }

  var headerPromise;
  var needsToRefresh = true;
  function refreshToken() {
    var authPromise = authAPI.request('/OAuth2-13', args).post();
    headerPromise = authPromise.then(extractToken).then(function (token) {
      return { headers: { 'Authorization': token } };
    });
    //Schedule updating of auth token
    authPromise.then(function (response) {
      setTimeout(function () { needsToRefresh = true },
        response.json.expires_in * 1000);
    });
  }

  //Create token from auth response
  function extractToken(response) {
    if (!response.json || !response.json.access_token) {
      throw "Invalid Bing authorization";
    }
    return "Bearer " + response.json.access_token;
  }

  var BAPI = new API('https://api.microsofttranslator.com/v2/Http.svc', Request, Promise);
  var isNonEmptyString = function(s) {
    return (s + '').length > 0;
  }

  this.translate = (function () {
    var argumentValidator = new Validator({
      'require': {
        'text': Validator.validate(isNonEmptyString, "Empty"),
        'to': Validator.validate(isNonEmptyString, "Empty"),
      },
      'accept': {
        'from': Validator.validate(isNonEmptyString, "Empty"),
      }
    });

    return function (args) {
      if (needsToRefresh) {
        //Refresh only as another request comes in
        refreshToken();
        needsToRefresh = false;
      }
      return BAPI.request('/Translate', args, argumentValidator)
                 .setOptionPromise(headerPromise);
    };
  })();
}

exports.Bing = Bing;
