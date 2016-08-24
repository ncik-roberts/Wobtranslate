var { translateValidator, sentenceValidator } = require('../server/wobvalidator.js');
var { API } = require('../base/promiseapi.js');
var { Request } = require('../base/xhr-wrapper.js');

var WobtranslateAPI = function(Request, Promise) {
  var WAPI = new API('http://localhost:8000', Request, Promise);

  this.translate = function (args) {
    return WAPI.request('/translate', args, translateValidator);
  }

  this.exampleSentences = function (args){
    return WAPI.request('/sentence', args, sentenceValidator);
  }
}

exports.WobtranslateAPI = WobtranslateAPI;
