/*\
title: $:/plugins/midorum/srs/modules/utils.js
type: application/javascript
module-type: utils

SRS utility functions.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const BOTH_DIRECTION = "both";
  const FORWARD_DIRECTION = "forward";
  const BACKWARD_DIRECTION = "backward";
  const SRS_FORWARD_DUE_FIELD = "srs-forward-due";
  const SRS_FORWARD_LAST_FIELD = "srs-forward-last";
  const SRS_BACKWARD_DUE_FIELD = "srs-backward-due";
  const SRS_BACKWARD_LAST_FIELD = "srs-backward-last";
  const SRS_ANSWER_RESET = "reset";
  const SRS_ANSWER_HOLD = "hold";
  const SRS_ANSWER_ONWARD = "onward";

  const SUPPORTED_DIRECTIONS = [FORWARD_DIRECTION, BACKWARD_DIRECTION, BOTH_DIRECTION];
  const ANSWER_DIRECTIONS = [FORWARD_DIRECTION, BACKWARD_DIRECTION];
  const SUPPORTED_ANSWERS = [SRS_ANSWER_RESET, SRS_ANSWER_HOLD, SRS_ANSWER_ONWARD];

  exports.BOTH_DIRECTION = BOTH_DIRECTION;
  exports.FORWARD_DIRECTION = FORWARD_DIRECTION;
  exports.BACKWARD_DIRECTION = BACKWARD_DIRECTION;
  exports.SRS_FORWARD_DUE_FIELD = SRS_FORWARD_DUE_FIELD;
  exports.SRS_FORWARD_LAST_FIELD = SRS_FORWARD_LAST_FIELD;
  exports.SRS_BACKWARD_DUE_FIELD = SRS_BACKWARD_DUE_FIELD;
  exports.SRS_BACKWARD_LAST_FIELD = SRS_BACKWARD_LAST_FIELD;
  exports.SRS_ANSWER_RESET = SRS_ANSWER_RESET;
  exports.SRS_ANSWER_HOLD = SRS_ANSWER_HOLD;
  exports.SRS_ANSWER_ONWARD = SRS_ANSWER_ONWARD;

  function trimToUndefined(str) {
    if (!str) return undefined;
    str = str.trim();
    return str ? str : undefined;
  }

  function parseJsonOrUndefined(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return undefined;
    }
  }

  function parseInteger(value, def) {
    if (!value) return def;
    if (Number.isInteger(value)) return value;
    if (typeof value === "string") {
      const parsed = Number.parseInt(value);
      if (Number.isInteger(parsed)) {
        return parsed;
      }
    }
    return def;
  }

  function arraysAreEqual(a, b, strict) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    if (strict === true) {
      return a.every((e, i) => e === b[i]);
    }
    return a.every(e => b.includes(e));
  }

  function purgeArray(srcArray, purgeArray) {
    if (!srcArray || !purgeArray || !Array.isArray(srcArray) || !Array.isArray(purgeArray)) return undefined;
    return srcArray.filter(el => !purgeArray.includes(el));
  }

  exports.trimToUndefined = trimToUndefined;
  exports.parseJsonOrUndefined = parseJsonOrUndefined;
  exports.parseInteger = parseInteger;
  exports.arraysAreEqual = arraysAreEqual;
  exports.purgeArray = purgeArray;

  exports.getSupportedDirections = function () {
    return SUPPORTED_DIRECTIONS.slice();
  };

  exports.getAnswerDirections = function () {
    return ANSWER_DIRECTIONS.slice();
  };

  exports.getSupportedAnswers = function () {
    return SUPPORTED_ANSWERS.slice();
  };

  exports.parseNumber = function (str, def) {
    const parsed = Number.parseInt(str);
    return !Number.isNaN(parsed) ? parsed : def;
  }

  exports.format = function (str, ...arr) {
    return str.replace(/%(\d+)/g, function (_, i) {
      return arr[--i];
    });
  }

  // Below are pure wiki-sensitive functions
  function getWikiUtils(wiki) {

    function getTiddlerTitle(titleOrTiddler) {
      return (titleOrTiddler instanceof $tw.Tiddler) ? titleOrTiddler.fields.title : titleOrTiddler;
    }

    function getTiddlerInstance(titleOrTiddler) {
      return (titleOrTiddler instanceof $tw.Tiddler) ? titleOrTiddler : wiki.getTiddler(titleOrTiddler);
    }

    // *
    function allTitlesWithTag(tag) {
      tag = trimToUndefined(tag);
      if (!tag) return;
      return wiki.getTiddlersWithTag(tag);
    }

    function getTiddlerTagsShallowCopy(titleOrTiddler) {
      if (!titleOrTiddler) return undefined;
      return (getTiddlerInstance(titleOrTiddler).fields.tags || []).slice(0);
    }

    function filterTiddlers(filterString, widget, source) {
      return wiki.filterTiddlers(filterString, widget, source);
    }

    function doWithTiddlerInstance(titleOrTiddler, callback) {
      if (!titleOrTiddler || !callback) return;
      return callback.call(null, getTiddlerInstance(titleOrTiddler), { doNotInvokeSequentiallyOnSameTiddler: doNotInvokeSequentiallyOnSameTiddler });
    }

    // Below are non-pure unsafe functions
    const unsafe = {

      addTiddler: function (fields) {
        wiki.addTiddler(new $tw.Tiddler(
          wiki.getCreationFields(),
          fields,
          wiki.getModificationFields()));
      },

      deleteTiddler: function (title) {
        wiki.deleteTiddler(title);
      }

    }

    // Below are non-pure unsafe functions that use TiddlyWiki message mechanism - they all shouldn't be invoked sequentially for the same tiddler
    function updateTiddler(titleOrTiddler, fields) {
      if (!titleOrTiddler || !fields) return;
      wiki.addTiddler(new $tw.Tiddler(
        getTiddlerInstance(titleOrTiddler),
        fields,
        wiki.getModificationFields()));
    };

    const doNotInvokeSequentiallyOnSameTiddler = {

      // *
      updateTiddler: updateTiddler,

      // *
      addTagsToTiddler: function (titleOrTiddler, tags) {
        if (!titleOrTiddler || !tags) return;
        const tagsToAdd = ($tw.utils.isArray(tags) ? tags : [tags]).filter(tag => tag);
        const tiddlerTags = getTiddlerTagsShallowCopy(titleOrTiddler);
        updateTiddler(titleOrTiddler, {
          tags: tiddlerTags.concat(purgeArray(tagsToAdd, tiddlerTags))
        })
      },

      // *
      deleteTagsToTiddler: function (titleOrTiddler, tags) {
        if (!titleOrTiddler || !tags) return;
        const tagsToDelete = ($tw.utils.isArray(tags) ? tags : [tags]).filter(tag => tag);
        updateTiddler(titleOrTiddler, {
          tags: purgeArray(getTiddlerTagsShallowCopy(titleOrTiddler), tagsToDelete)
        });
      },

      // *
      // Set a tiddlers content to a JavaScript object.
      setTiddlerData: function (titleOrTiddler, dataObj) {
        if (!titleOrTiddler || !dataObj) return;
        const tiddlerTitle = getTiddlerTitle(titleOrTiddler);
        const data = wiki.getTiddlerData(tiddlerTitle, Object.create(null));
        Object.entries(dataObj).forEach(([key, value]) => {
          if (value !== undefined) {
            data[key] = value;
          } else {
            delete data[key];
          }
        });
        wiki.setTiddlerData(tiddlerTitle, data, {}, {});
      },

      appendTiddlerField: function (titleOrTiddler, field, value, separator) {
        if (!titleOrTiddler || !field) return;
        const tiddler = getTiddlerInstance(titleOrTiddler);
        const tiddlerTitle = tiddler.fields.title;
        if (tiddler) {
          const current = tiddler.fields[field];
          if (current && separator) {
            wiki.setText(tiddlerTitle, field, undefined, current + separator + value, {});
          } else if (current) {
            wiki.setText(tiddlerTitle, field, undefined, current + value, {});
          } else {
            wiki.setText(tiddlerTitle, field, undefined, value, {});
          }
        } else {
          wiki.setText(tiddlerTitle, field, undefined, value, {});
        }
      }

    }

    return {
      wiki: wiki,
      unsafe: unsafe,
      doWithTiddlerInstance: doWithTiddlerInstance,
      filterTiddlers: filterTiddlers,
      allTitlesWithTag: allTitlesWithTag,
      getTiddlerTagsShallowCopy: getTiddlerTagsShallowCopy,
    };

  }

  exports.getWikiUtils = getWikiUtils;

})();