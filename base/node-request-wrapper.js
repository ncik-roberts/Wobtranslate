'use strict';
var request = require('request');

/* Function that complies with the Request interface set forth in
 * promiseapi.js. Preconditions/postconditions follow from that interface.
 */
exports.Request = function () {
  //Avoid annoying issues with "this"
  var me = this;
  this.open = function (method) {
    var callback = function (error, response, body) {
      console.log("Returning from " + me.url);
      try {
        return me.onComplete({
          text: body,
          json: JSON.parse(body),
          headers: response.headers,
          status: response.statusCode,
          error: error
        });
      } catch (e) {
        //Then JSON.parse did not succeed
        return me.onComplete({
          text: body,
          headers: response.headers,
          status: response.statusCode,
          error: error
        });
      }
    }

    var url = me.url;
    if (method === 'get' && me.body) {
      url += '?' + me.body;
    }

    var arg = { url: url }
    if (me.headers) {
      arg.headers = me.headers;
    }
    if (me.timeout) {
      arg.timeout = me.timeout;
    }
    if (me.body && method !== 'get') {
      arg.body = me.body;
      console.log(JSON.stringify(arg));
    }

    console.log(JSON.stringify(arg));
    return request[method](arg, callback);
  };

  this.get = function () {
    me.open('get');
  };

  this.post = function () {
    me.open('post');
  };

  this.put = function () {
    me.open('put');
  };

  this.delete = function () {
    me.open('delete');
  };

  this.head = function () {
    me.open('head');
  };
}
