'use strict';

/* This file has jQuery as a dependency, so be sure to include it
 * before including this file.
 */
var $phrase = $('#phrase');
var $to = $('#to');
var $from = $('#from');
var $translation = $('#translation');
var $sentence = $('#sentence');
var $sentenceTranslation = $('#sentenceTranslation');
var $error = $('#error');
var $translationTitle = $('#translationtitle');
var $sentenceTitle = $('#sentencetitle');
var $translationSource = $('#translationsource');
var $sentenceSource = $('#sentencesource');

var translations = [];
var sentences = [];
var translationIndex = 0;
var sentenceIndex = 0;
var translationSuccess = true;
var sentenceSuccess = true;

var width = 510, height = 260;

/*************** INITIALIZE JQUERY STUFF *********/
//Make errors not overflow
$error.width(width + 'px');

//If any fields are changed, request translation
$('fieldset > input, fieldset > selector').on('change', request);

$('#to, #from').off().on('change', function () {
  if (this.value === "enter") {
    addInput(this);
  } else {
    var oldinput = $(this).next('input[name="code"]');
    if (oldinput.length) {
      oldinput.remove();
      height -= 20;
      self.port.emit('resize', width, height);
    }
    request();
  }
});

$('#sentence, #sentenceTranslation, #translation').on('change', function () {
  $(this).data('changed', true);
});

function addInput(ontoElement) {
  height += 20;
  self.port.emit('resize', width, height);
  var newinput = $('<input type="text" name="code"></input>');
  newinput.on('change', request);
  $(ontoElement).after(newinput);
}

//Set onclick events for moving among translations
$('#prevsentence').on('click', function () {
  sentenceIndex--;
  sentenceIndex = adjust(sentenceIndex, sentences);
  showSentence();
});

$('#nextsentence').on('click', function () {
  sentenceIndex++;
  sentenceIndex = adjust(sentenceIndex, sentences);
  showSentence();
});

$('#prevtranslation').on('click', function () {
  translationIndex--;
  translationIndex = adjust(translationIndex, translations);
  showTranslation();
});

$('#nexttranslation').on('click', function () {
  translationIndex++;
  translationIndex = adjust(translationIndex, translations);
  showTranslation();
});

$('#save-preferences').on('click', function () {
  var preferences = {
    to: getCode($to),
    from: getCode($from),
  };
  self.port.emit('store', 'preferences', preferences);
});

$('#save-translation').on('click', function () {
  var translation = translations[translationIndex];
  var sentence = sentences[sentenceIndex];
  var trans = { phrase: $phrase.val() };
  if (translation || $translation.data('changed')) {
    trans.translation = $translation.val();
    trans.translationAuthor = translation ? translation.authors : translation.source;
  }

  if (sentence || $sentence.data('changed')) {
    trans.fromSentence = $sentence.val();
    trans.toSentence = $sentenceTranslation.val();
    trans.sentenceAuthor = sentence ? sentence.author : sentence.source;
  }

  self.port.emit('addstore', 'translations', trans);
  alert("Translation saved for '" + phrase + "'!");
});

$('#export-saved').on('click', function () {
  self.port.emit('download', 'translations');
});

function select($elem, val) {
  var selected = $elem.find("option").filter(function () {
    return $(this).val() === val;
  }).first();
  if (selected.length) {
    selected.attr('selected', 'selected');
  } else {
    $elem.find('option[value="enter"]').attr('selected', 'selected');
    addInput($elem);
    $elem.next('input').val(val);
  }
}

/*************************************************/

/* index.js sends the selected text to the content script,
 * which here uses that text as the default value of the phrase
 * input.
 */
self.port.on('focus', function (phraseText) {
  //Reset screen
  sentenceSuccess = translationSuccess = true;
  clearError();
  $phrase.val(phraseText);
  request();
});

function getCode($elem) {
  var code = $elem.next('input[name="code"]');
  if (code.length) {
    return code.val();
  }
  return $elem.val();
}

//Logic for requesting the translation of a word
function request() {
  var phrase = $phrase.val();
  var to = getCode($to);
  var from = getCode($from);

  self.port.emit('translate', phrase, to, from);
  self.port.emit('sentence', phrase, to, from);
}

//Display current index of translation in the translation box
function showTranslation() {
  if (translationIndex >= translations.length) {
    $translation.val("No translation found.");
    $translationSource.off('click');
    $translation.data('changed', false);
  } else {
    var t = translations[translationIndex];
    $translation.val(t.translation);
    $translationSource.text("Source: " + t.source);
    $translationSource.on('click', function () {
      if (t.url) {
        window.open(t.url);
      }
    });
  }
}

//Display current sentence and its translation
function showSentence() {
  if (sentenceIndex >= sentences.length) {
    $sentence.val("No sentence found.");
    $sentenceTranslation.val("No sentence found.");
    //Set fields that are useful in determining what to save
    $sentence.data('changed', false);
    $sentenceTranslation.data('changed', false);
    $sentenceSource.off('click');
  } else {
    var s = sentences[sentenceIndex];
    $sentence.val(s.fromSentence);
    $sentenceTranslation.val(s.toSentence);
    $sentenceSource.text("Source: " + s.source);
    $sentenceSource.on('click', function () {
      if (s.url) {
        window.open(s.url);
      } else if (s.authors) {
        window.open(s.authors[0].url);
      }
    });
  }
}

//Deal with array of translations
self.port.on('translate', function (data) {
  translationSuccess = true;
  translationIndex = 0;
  translations = data;
  showTranslation();
  clearError();
});

//Deal with array of sentences
self.port.on('sentence', function (data) {
  sentenceSuccess = true;
  sentenceIndex = 0;
  sentences = data;
  showSentence();
  clearError();
});

//Returns an index in bounds A, or 0 if none exists
function adjust(i, A) {
  if (0 <= i && i < A.length) return i;
  if (i >= A.length) return 0;
  if (i < 0 && A.length) return A.length - 1;
  return 0;
}

//Clear error if all functions returned successfully
function clearError() {
  if (sentenceSuccess && translationSuccess) {
    $error.text('');
    self.port.emit('resize', width, height);
  }
}

//Deal with errors
self.port.on('error', function (error) {
  sentenceSuccess = translationSuccess = false;
  $error.text(error);
  self.port.emit('resize', width, height + $error.height() + 10);
});

//Deal with loading of default options from storage
self.port.emit('unstore', 'preferences');
self.port.on('unstore', function (key, value) {
  if (key === 'preferences' && value) {
    select($to, value.to);
    select($from, value.from);
  }
});

//Open url
self.port.on('open', function (uri) {
  window.open(uri);
});
