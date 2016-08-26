'use strict';
var { XMLHttpRequest } = require('sdk/net/xhr');

/* Wrapper for firefox extension XMLHttpRequest
 * Satisfies interface for Request in promiseapi.js
 */
exports.Request = function(obj) {
  var request = new XMLHttpRequest();
  //Avoid annoying issues with this
  var me = this;

  request.addEventListener('timeout', function () {
    me.onComplete({
      error: "Timeout",
      status: 408
    });
  });

  request.addEventListener('error', function() {
    me.onComplete({
      error: "Connection failed",
      status: 500
    });
  });

  request.addEventListener('load', function () {
    this.text = this.responseText;
    this.json = JSON.parse(this.responseText);
    me.onComplete(this);
  });

  this.open = function (method) {
    var url = me.url;
    if (method === 'get' && me.body) {
      url += '?' + me.body;
    }
    request.open(method, url, true);

    //set headers after open is called
    if (me.headers) {
      for (var x in me.headers) {
        if (me.headers.hasOwnProperty(x)) {
          request.setRequestHeader(x, me.headers[x]);
        }
      }
    }

    //set timeout after open is called
    if (me.timeout) {
      request.timeout = me.timeout;
    }

    request.send(method === 'get' ? null : me.body);
  };

  this.get = function () { me.open('get'); };
  this.put = function () { me.open('put'); };
  this.post = function () { me.open('post'); };
  this.delete = function () { me.open('delete'); };
  this.head = function () { me.open('head'); };
}
