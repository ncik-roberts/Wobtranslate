//Thanks underscore.js: returns if obj is a function
function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
}

var Validator = function(obj) {
  var require = obj.require;
  var accept = obj.accept;

  //validate required arguments
  this.rejectsRequired = function (args) {
    for (var key in require) {
      if (require.hasOwnProperty(key)) {
        if (!args || !(key in args) || !require[key].validatesOn(args[key])) {
          return "There was an error validating the required argument `" + key + "`." +
            "\nThe provided value was: " + (args && args[key]) +
            "\nThe error message is: " + (require[key].errorMessage || "Error");
        }
      }
    }
  };

  //validate optional arguments
  this.rejectsOptional = function (args) {
    for (var key in accept) {
      if (accept.hasOwnProperty(key)) {
        if (args && key in args && !accept[key].validatesOn(args[key])) {
          return "There was an error validating the optional argument `" + key + "`." +
            "\nThe provided value was: " + args[key] +
            "\nThe error message is: " + (accept[key].errorMessage || "Error");
        }
      }
    }
  };

  //Check both sets of arguments
  this.rejects = function (args) {
    return this.rejectsRequired(args) || this.rejectsOptional(args);
  };

  var errorFn = function () {
    return "The validator for `" + key + "` isn't a function. Better change that.";
  }

  //Verify that all elements of require/accept are functions
  //If not, replace the rejectsRequired and rejectsOptional functions with a generic error
  for (var key in require) {
    if (require.hasOwnProperty(key) && !isFunction(require[key].validatesOn)) {
      this.rejectsRequired = errorFn;
      this.rejectsOptional = errorFn;
    }
  }

  for (var key in accept) {
    if (accept.hasOwnProperty(key) && !isFunction(accept[key].validatesOn)) {
      this.rejectsRequired = errorFn;
      this.rejectsOptional = errorFn;
    }
  }
}

Validator.validate = function (validatesOn, errorMessage) {
  return {
    'validatesOn': validatesOn,
    'errorMessage': errorMessage
  };
};

exports.Validator = Validator;
