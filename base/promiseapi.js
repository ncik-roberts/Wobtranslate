'use strict';
/* url: the base url used for requests
 * Request: a constructor that takes no argument and returns an object with settable properties:
 *    - url (string): the url to access
 *    - onComplete (function): the callback function, taking xhr as argument
 *    - headers (object): the headers to pass along with the request
 *    - timeout (int): the number of milliseconds following which to timeout
 *  and has the following methods:
 *    - get, post, put, delete, head (function): no argument
 *        the respective HTTP methods
 * Promise: see https://www.promisejs.org
 */
var API = function (url, Request, Promise) {
  //Precondition: args has at least one own property
  //Returns: uri suffix as according to args
  function constructURIArgs(args) {
    var suffix = '';
    var isFirstArg = true;
    for (var key in args) {
      if (args.hasOwnProperty(key)) {
        if (!isFirstArg) {
          suffix += '&';
        }
        suffix += key + '=' + args[key];
        isFirstArg = false;
      }
    }
    return suffix;
  }

  function isOKStatus(xhr) {
    return xhr.status >= 200 && xhr.status < 300;
  }

  //Creates an object that with get, post, put, and delete properties
  //Each one performs its corresponding request asynchronously
  function createAJAXObject(ajax) {
    //We want optionPromise to resolve asynchronously so we can use results from other promises in it
    var optionPromise = Promise.resolve({});
    return {
      get: function () { return ajax('get', optionPromise) },
      post: function () { return ajax('post', optionPromise) },
      put: function () { return ajax('put', optionPromise) },
      delete: function () { return ajax('delete', optionPromise) },
      head: function () { return ajax('head', optionPromise) },
     /* options is an object containing optionally the parameters:
      *  - headers: (object) the headers to pass along with the request
      *  - timeout: (number) the milliseconds following which to cancel the request
      */
      setOptions: function (o) {
        for (var key in o) {
          optionPromise.then(function (options) {
            options[key] = o[key];
          });
        }
        return this;
      },
      setOptionPromise: function (promise) {
        optionPromise = promise;
        return this;
      }
    }
  }

  /* endpoint must be of the format /name/of/endpoint.
   * args is the object representing arguments to pass to method.
   * argumentValidator is the Validator object for the properties of args.
  */
  this.request = function (endpoint, args, argumentValidator) {
    var uri = url + endpoint;
    var body;
    if (args) {
      body = constructURIArgs(args);
    }

    var ajax = function (method, optionPromise) {
      //Bail out early if arguments are formatted badly
      if (argumentValidator) {
        var errorMessage = argumentValidator.rejects(args);
        if (errorMessage) {
          return Promise.reject(errorMessage);
        }
      }

      //Wrap request in a Promise to do request asynchronously
      return new Promise(function (resolve, reject) {
        var req = new Request();
        req.url = uri;
        req.body = body;
        req.onComplete = function (response) {
          if (isOKStatus(response)) {
            resolve(response);
          } else {
            reject(response.error);
          }
        };

        //Don't send the request until we have resolved the options
        optionPromise.then(function (options) {
          if (options && options.headers) {
            req.headers = options.headers;
          }
          if (options && options.timeout) {
            req.timeout = options.timeout;
          }

          req[method]();
        });
      });
    };
    return createAJAXObject(ajax);
  }
}
exports.API = API;
