/*\
title: $:/plugins/midorum/srs/modules/utils.js
type: application/javascript
module-type: utils

SRS utility functions.

\*/

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
const SRS_ANSWER_EXCLUDE = "exclude";
const SRS_BASE_TIME = new Date(2000, 0, 1).getTime();

const SUPPORTED_DIRECTIONS = [FORWARD_DIRECTION, BACKWARD_DIRECTION, BOTH_DIRECTION];
const ANSWER_DIRECTIONS = [FORWARD_DIRECTION, BACKWARD_DIRECTION];
const SUPPORTED_ANSWERS = [SRS_ANSWER_RESET, SRS_ANSWER_HOLD, SRS_ANSWER_ONWARD, SRS_ANSWER_EXCLUDE];

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

function arraysIntersection(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2) || !arr1.length || !arr2.length) return [];
  var a1, a2;
  if (arr1.length < arr2.length) {
    a1 = arr1;
    a2 = arr2;
  } else {
    a1 = arr2;
    a2 = arr1;
  }
  const map = new Map();
  const result = [];
  a1.forEach(i => map.set(i, i));
  for (let i = 0; i < a2.length; i++) {
    if (map.has(a2[i])) {
      result.push(a2[i]);
      map.delete(a2[i]);
      if(!map.size) break;
    }
  }
  return result;
}

function getSupportedDirections() {
  return SUPPORTED_DIRECTIONS.slice();
};

function getAnswerDirections() {
  return ANSWER_DIRECTIONS.slice();
};

function getSupportedAnswers() {
  return SUPPORTED_ANSWERS.slice();
};

function formatString(str, ...arr) {
  return str.replace(/%(\d+)/g, function (_, i) {
    return arr[--i];
  });
}

// Below are wiki-sensitive functions
function getWikiUtils(wiki) {

  function getTitleAndInstance(titleOrTiddler) {
    return (titleOrTiddler instanceof $tw.Tiddler) ? {
      title: titleOrTiddler.fields.title,
      instance: titleOrTiddler
    } : {
      title: titleOrTiddler,
      instance: wiki.getTiddler(titleOrTiddler)
    };
  }

  function allTitlesWithTag(tag) {
    tag = trimToUndefined(tag);
    if (!tag) return undefined;
    return wiki.getTiddlersWithTag(tag);
  }


  function filterTiddlers(filterString, widget, source) {
    return wiki.filterTiddlers(filterString, widget, source);
  }

  function addTiddler(fields) {
    wiki.addTiddler(new $tw.Tiddler(
      wiki.getCreationFields(),
      fields,
      wiki.getModificationFields()));
  }

  function withTiddler(titleOrTiddler) {
    if (!titleOrTiddler) throw new Error("title or tiddler is required");
    const tiddler = getTitleAndInstance(titleOrTiddler);

    function updateTiddler(fields) {
      if (!fields) throw new Error("fields parameter is required");
      if (tiddler.instance) {
        wiki.addTiddler(new $tw.Tiddler(
          tiddler.instance,
          fields,
          wiki.getModificationFields()));
      }
    };

    function getTiddlerTagsShallowCopy() {
      return tiddler.instance ? (tiddler.instance.fields.tags || []).slice(0) : [];
    }

    function getTiddlerField(field, defaultValue) {
      return (tiddler.instance && field) ? tiddler.instance.getFieldString(field, defaultValue) : defaultValue;
    }

    return {
      exists: () => !!tiddler.instance,
      getTitle: () => tiddler.title,
      getTiddlerTagsShallowCopy: getTiddlerTagsShallowCopy,
      getTiddlerField: getTiddlerField,
      // Below are non-pure unsafe functions that use TiddlyWiki message mechanism - they all shouldn't be invoked sequentially for the same tiddler
      doNotInvokeSequentiallyOnSameTiddler: {
        updateTiddler: updateTiddler,
        deleteTiddler: function () {
          wiki.deleteTiddler(tiddler.title);
        },
        addTagsToTiddler: function (tags) {
          if (!tags) throw new Error("tags parameter is required");
          const tagsToAdd = ($tw.utils.isArray(tags) ? tags : [tags]).filter(tag => tag);
          const tiddlerTags = getTiddlerTagsShallowCopy();
          updateTiddler({
            tags: tiddlerTags.concat(purgeArray(tagsToAdd, tiddlerTags))
          })
        },
        deleteTagsToTiddler: function (tags) {
          if (!tags) throw new Error("tags parameter is required");
          const tagsToDelete = ($tw.utils.isArray(tags) ? tags : [tags]).filter(tag => tag);
          updateTiddler({
            tags: purgeArray(getTiddlerTagsShallowCopy(), tagsToDelete)
          });
        },
        // Sets a tiddler's content to a JavaScript object. Creates tiddler if it does not exist.
        setOrCreateTiddlerData: function (dataObj) {
          if (!dataObj) throw new Error("tiddler data are required");
          const data = wiki.getTiddlerData(tiddler.title, Object.create(null));
          Object.entries(dataObj).forEach(([key, value]) => {
            if (value !== undefined) {
              data[key] = value;
            } else {
              delete data[key];
            }
          });
          wiki.setTiddlerData(tiddler.title, data, {}, {});
        }
      }
    };
  }

  return {
    wiki: wiki,
    withTiddler: withTiddler,
    filterTiddlers: filterTiddlers,
    allTitlesWithTag: allTitlesWithTag,
  };

}

exports.srsUtils = {
  BOTH_DIRECTION: BOTH_DIRECTION,
  FORWARD_DIRECTION: FORWARD_DIRECTION,
  BACKWARD_DIRECTION: BACKWARD_DIRECTION,
  SRS_FORWARD_DUE_FIELD: SRS_FORWARD_DUE_FIELD,
  SRS_FORWARD_LAST_FIELD: SRS_FORWARD_LAST_FIELD,
  SRS_BACKWARD_DUE_FIELD: SRS_BACKWARD_DUE_FIELD,
  SRS_BACKWARD_LAST_FIELD: SRS_BACKWARD_LAST_FIELD,
  SRS_ANSWER_RESET: SRS_ANSWER_RESET,
  SRS_ANSWER_HOLD: SRS_ANSWER_HOLD,
  SRS_ANSWER_ONWARD: SRS_ANSWER_ONWARD,
  SRS_ANSWER_EXCLUDE: SRS_ANSWER_EXCLUDE,
  SRS_BASE_TIME: SRS_BASE_TIME,
  trimToUndefined: trimToUndefined,
  parseJsonOrUndefined: parseJsonOrUndefined,
  parseInteger: parseInteger,
  arraysAreEqual: arraysAreEqual,
  arraysIntersection: arraysIntersection,
  purgeArray: purgeArray,
  getSupportedDirections: getSupportedDirections,
  getAnswerDirections: getAnswerDirections,
  getSupportedAnswers: getSupportedAnswers,
  formatString: formatString,
  getWikiUtils: getWikiUtils
};