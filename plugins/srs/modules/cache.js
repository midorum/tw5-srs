/*\
title: $:/plugins/midorum/srs/modules/cache.js
type: application/javascript
module-type: utils

Simple cache.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const srsFilterOperatorsCache = (function () {
    var operators;
    return {
      get: function (operator) {
        if (!operators) {
          operators = {};
          $tw.modules.applyMethods("srsfilteroperator", operators);
        }
        return operators[operator];
      }
    }
  })();

  const tagsCache = (function () {
    var tags;
    return {
      get: function (keys) {
        if (!tags) {
          tags = $tw.wiki.getTiddlerData("$:/plugins/midorum/srs/data/tags", []);
        }
        const result = {};
        if (!keys.length) {
          Object.assign(result, tags);
        } else {
          keys.filter(key => tags[key]).forEach(key => result[key] = tags[key]);
        }
        return result;
      }
    }
  })();

  exports.getSrsFilterOperator = function (operator) {
    return srsFilterOperatorsCache.get(operator)
  }

  exports.getTags = function (keys) {
    return tagsCache.get(keys);
  };

})();