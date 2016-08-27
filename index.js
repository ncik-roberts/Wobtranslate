'use strict';
var contextMenu = require('sdk/context-menu');
var { data } = require('sdk/self');
var { Request } = require('./base/xhr-wrapper.js');
var jqueryUrl = data.url('jquery-1.12.4-min.js');
var ss = require('sdk/simple-storage');

var { WobtranslateAPI } = require ('./api/wobapi.js');
var WAPI = new WobtranslateAPI(Request, Promise);

//Create main wobtranslate interface
var wobtranslate = require('sdk/panel').Panel({
  contentURL: data.url('wobtranslate-dialog.html'),
  contentScriptFile: [jqueryUrl, data.url('wobtranslate-dialog.js')]
});

//Function to be called from right-click menu
function createWobtranslateDialog(selection) {
  wobtranslate.show();
  wobtranslate.port.emit('focus', selection);
}

//Show wobtranslate screen without changing text/requesting
function restoreWobtranslateDialog() {
  wobtranslate.show();
  wobtranslate.port.emit('restore');
}

//Create menu to show up during right click
var menuItem = contextMenu.Item({
  label: "Wobtranslate",
  accessKey: "w",
  contentScript: 'self.on("click", function () {' +
                 '  var text = window.getSelection().toString();' +
                 '  self.postMessage(text);' +
                 '});',
  onMessage: function (selectionText) {
    if (selectionText) {
      createWobtranslateDialog(selectionText);
    } else {
      restoreWobtranslateDialog();
    }
  }
});

//Manage request for translation of a word
wobtranslate.port.on('translate', function (phrase, to, from) {
  WAPI.translate({
    to: to,
    from: from,
    phrase: phrase
  }).setOptions({
    timeout: 5000
  }).get().then(function (response) {
    if (!response || !response.json) {
      throw "Wobtranslate returned unexpected result.";
    }
    wobtranslate.port.emit('translate', response.json);
  }).catch(function (error) {
    wobtranslate.port.emit('error', error);
  });
});

//Manage request for example sentence
wobtranslate.port.on('sentence', function (phrase, to, from) {
  WAPI.exampleSentences({
    to: to,
    from: from,
    phrase: phrase,
  }).setOptions({
    timeout: 5000
  }).get().then(function (response) {
    if (!response || !response.json) {
      throw "Wobtranslate returned unexpected result.";
    }
    wobtranslate.port.emit('sentence', response.json);
  }).catch(function (error) {
    wobtranslate.port.emit('error', error);
  });
});

//Give it the ability to resize itself
wobtranslate.port.on('resize', function (width, height) {
  wobtranslate.resize(width, height);
});

//Allow access to local storage
wobtranslate.port.on('store', function (key, value) {
  ss.storage[key] = value;
});

//Allow appending to array in local storage
wobtranslate.port.on('addstore', function (key, value) {
  if (!ss.storage[key]) {
    ss.storage[key] = [];
  }
  ss.storage[key].push(value);
});

wobtranslate.port.on('unstore', function (key) {
  wobtranslate.port.emit('unstore', key, ss.storage[key]);
});

ss.on('OverQuota', function () {
  wobtranslate.port.emit('error', "Storage limit reached. Please export your saved translations, or no new translations will be saved.");
});

/******** DOWNLOADING CSV ********/
function csvEncode(str) {
  if (str.indexOf(',') === -1
   && str.indexOf('"') === -1
   && str.indexOf("\n") === -1) {
    return str;
  }
  return '"' + str.replace(/"/, '""') + '"';
}
wobtranslate.port.on('download', function (key) {
  var array = ss.storage[key];
  if (!array || !array.length) {
    wobtranslate.port.emit('error', "No translations to export");
    return;
  }

  var csvContent = "data:text/csv;charset=utf-8,";
  var keys = Object.keys(array[0]);
  keys.sort();
  csvContent += keys.join(",");
  for (var i = 0; i < array.length; i++) {
    csvContent += "\n" + keys.map(function (key) {
      if (array[i][key] === undefined) return "";
      return csvEncode(array[i][key]);
    }).join(",");
  }

  var encodedURI = encodeURI(csvContent);
  wobtranslate.port.emit('open', encodedURI);
});
