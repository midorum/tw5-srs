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

  function allTitlesWithTag(tag) {
    tag = trimToUndefined(tag);
    if (!tag) return;
    return $tw.wiki.getTiddlersWithTag(tag);
  }

  exports.trimToUndefined = trimToUndefined;

  exports.parseJsonOrUndefined = parseJsonOrUndefined;

  exports.parseInteger = parseInteger;

  exports.arraysAreEqual = arraysAreEqual;

  exports.allTitlesWithTag = allTitlesWithTag;

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

  exports.allTiddlersWithTag = function (tag) {
    return allTitlesWithTag(tag)
      .map(title => $tw.wiki.getTiddler(title));
  };

  // not pure
  exports.setTiddlerField = function (tiddlerTitle, field, value) {
    if (!tiddlerTitle || !field) return;
    $tw.wiki.setText(tiddlerTitle, field, undefined, value, {});
  }

  // not pure
  exports.setTiddlerFields = function (tiddler, fieldsMap) {
    if (!tiddler || !fieldsMap) return;
    const modification = $tw.wiki.getModificationFields();
    $tw.wiki.addTiddler(new $tw.Tiddler(tiddler, fieldsMap, modification));
  }

  // not pure
  exports.setTiddlerData = function (tiddlerTitle, dataObj) {
    if (!tiddlerTitle || !dataObj) return;
    const data = $tw.wiki.getTiddlerData(tiddlerTitle, Object.create(null));
    Object.entries(dataObj).forEach(([key, value]) => {
      if (value !== undefined) {
        data[key] = value;
      } else {
        delete data[key];
      }
    });
    $tw.wiki.setTiddlerData(tiddlerTitle, data, {}, {});
  }

  // not pure
  exports.addTagToTiddler = function (tiddler, tag) {
    if (!tiddler) return;
    const modification = $tw.wiki.getModificationFields();
    modification.tags = (tiddler.fields.tags || []).slice(0);
    $tw.utils.pushTop(modification.tags, tag);
    $tw.wiki.addTiddler(new $tw.Tiddler(tiddler, modification));
  }

  // not pure
  exports.removeTagFromTiddler = function (tiddler, tagTitle) {
    if (!tiddler || !tiddler.fields.tags || !tiddler.fields.tags.length) return;
    var index = tiddler.fields.tags.indexOf(tagTitle);
    if (index === -1) return;
    const modification = $tw.wiki.getModificationFields();
    modification.tags = tiddler.fields.tags.slice(0);
    modification.tags.splice(index, 1);
    if (modification.tags.length === 0) {
      modification.tags = undefined;
    }
    $tw.wiki.addTiddler(new $tw.Tiddler(tiddler, modification));
  }

})();