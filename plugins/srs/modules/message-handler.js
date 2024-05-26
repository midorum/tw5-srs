/*\
title: $:/plugins/midorum/srs/modules/message-handler.js
type: application/javascript
module-type: srs-module

Handling SRS messages.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const utils = require("$:/plugins/midorum/srs/modules/utils.js");
  const cache = require("$:/plugins/midorum/srs/modules/cache.js");

  const session = (function () {
    const _comparator = (a, b) => a.due - b.due;
    const _now = () => new Date().getTime();
    var _context;
    var _src;
    var _takeForward;
    var _takeBackward;
    var _groupFilter;
    var _groupStrategy;
    var _ttl;
    var _repeat = [];
    var _overdue = [];
    var _newcomer = [];
    var _groups = [];
    var _current;
    function getForwardEntry(tiddler) {
      if (!(tiddler.fields.tags || []).includes(_context.tags.scheduledForward)) return undefined;
      return {
        due: utils.parseInteger(tiddler.fields[utils.SRS_FORWARD_DUE_FIELD]),
        direction: utils.FORWARD_DIRECTION,
        src: tiddler.fields.title
      };
    }
    function getBackwardEntry(tiddler) {
      if (!(tiddler.fields.tags || []).includes(_context.tags.scheduledBackward)) return undefined;
      return {
        due: utils.parseInteger(tiddler.fields[utils.SRS_BACKWARD_DUE_FIELD]),
        direction: utils.BACKWARD_DIRECTION,
        src: tiddler.fields.title
      };
    }
    function initialize(src, direction, groupFilter, groupStrategy, context) {
      _context = {
        tags: cache.getTags(["scheduledForward", "scheduledBackward"]),
        wikiUtils: context.wikiUtils
      };
      _src = src;
      _takeForward = direction === utils.FORWARD_DIRECTION || direction === utils.BOTH_DIRECTION;
      _takeBackward = direction === utils.BACKWARD_DIRECTION || direction === utils.BOTH_DIRECTION;
      if (groupFilter && groupStrategy) {
        _groupFilter = groupFilter;
        _groupStrategy = groupStrategy;
      }
    }
    function groupStrategyIsSatisfied(title) {
      if (!_groupFilter) return true;
      const titleGroup = _context.wikiUtils.filterTiddlers(_groupFilter.replaceAll("<currentTiddler>", "[" + title + "]"));
      if (_groupStrategy === "groupOnly") {
        return titleGroup.length !== 0; // the tiddler belongs the group
      }
      if (_groupStrategy === "notInGroup") {
        return titleGroup.length === 0; // the tiddler does not belong the group
      }
      const groupIsFound = _groups.findIndex(group => utils.arraysAreEqual(group, titleGroup)) !== -1;
      if (_groupStrategy === "oneFromGroup") {
        if (groupIsFound) return false; // this is the second found tiddler from the group
        _groups.push(titleGroup);
        return true;
      }
      console.warn("Unknown group strategy: " + _groupStrategy + " - ignored");
      return true;
    }
    function refill() {
      const now = _now();
      _repeat = [];
      _overdue = [];
      _newcomer = [];
      _context.wikiUtils.allTitlesWithTag(_src)
        .forEach(title => {
          if (!groupStrategyIsSatisfied(title)) return;
          _context.wikiUtils.doWithTiddlerInstance(title, instance => {
            if (_takeForward) {
              const forwardEntry = getForwardEntry(instance);
              if (forwardEntry) {
                if (!forwardEntry.due) {
                  _newcomer.push(forwardEntry);
                  return; // if we have taken forward we skip backward for same source
                } else if (forwardEntry.due <= now) {
                  _overdue.push(forwardEntry);
                  return; // if we have taken forward we skip backward for same source
                }
              }
            }
            if (_takeBackward) {
              const backwardEntry = getBackwardEntry(instance);
              if (backwardEntry) {
                if (!backwardEntry.due) {
                  _newcomer.push(backwardEntry);
                } else if (backwardEntry.due <= now) {
                  _overdue.push(backwardEntry);
                }
              }
            }
          })
        });
      _overdue.sort(_comparator);
      _ttl = now + 600000; // 10 minutes
    }
    function next() {
      const now = _now();
      if (_repeat.length !== 0 && _repeat[0].due <= now) {
        _current = _repeat.shift();
        return _current;
      }
      if (_overdue.length !== 0) {
        _current = _overdue.shift();
        return _current;
      }
      if (_newcomer.length !== 0) {
        _current = _newcomer.shift();
        return _current;
      }
      return undefined;
    }
    function acceptAnswer(src, newDue) {
      if (newDue > _ttl || _current.src !== src) return;
      _current.due = newDue;
      _repeat.push(_current);
      _repeat.sort(_comparator);
      _current = undefined;
    }
    function counters() {
      return {
        repeat: _repeat.length + 1,
        overdue: _overdue.length,
        newcomer: _newcomer.length
      };
    }
    function _log() {
      console.log("SRS:session",
        "\n_src", _src,
        "\n_takeForward", _takeForward,
        "\n_takeBackward", _takeBackward,
        "\n_groupFilter", _groupFilter,
        "\n_groupStrategy", _groupStrategy,
        "\n_ttl", _ttl,
        "\n_repeat", _repeat,
        "\n_overdue", _overdue,
        "\n_newcomer", _newcomer,
        "\n_groups", _groups,
        "\n_current", _current
      );
    }
    return {
      getFirst: function (src, direction, groupFilter, groupStrategy, log) {
        initialize(src, direction, groupFilter, groupStrategy);
        refill();
        if (log) _log();
        else _groups.length = 0;
        return {
          entry: next(),
          counters: counters()
        };
      },
      acceptAnswerAndGetNext: function (src, newDue, log) {
        if (_now() < _ttl) {
          acceptAnswer(src, newDue);
        } else {
          refill();
        }
        if (log) _log();
        else _groups.length = 0;
        return {
          entry: next(),
          counters: counters()
        };
      }
    }
  })();

  // tested
  exports.schedule = function (ref, direction, idle, widget) {
    const alertMsg = "%1 cannot be empty";
    const logger = new $tw.utils.Logger("SRS:schedule");
    const context = {
      tags: cache.getTags([]),
      wikiUtils: utils.getWikiUtils(widget.wiki)
    };
    const supportedDirections = utils.getSupportedDirections();
    ref = utils.trimToUndefined(ref);
    if (!ref) {
      logger.alert(utils.format(alertMsg, "ref"));
      return;
    }
    direction = utils.trimToUndefined(direction);
    if (!direction || !supportedDirections.includes(direction)) {
      logger.alert(utils.format(alertMsg + " and should be one of %2", "direction", supportedDirections));
      return;
    }
    if (idle) {
      console.log("SRS:schedule", idle, ref, direction);
      return;
    }
    context.wikiUtils.doWithTiddlerInstance(ref, (instance, unsafe) => {
      if (!instance) return;
      const tags = [];
      if (direction === utils.FORWARD_DIRECTION || direction === utils.BOTH_DIRECTION) {
        tags.push(context.tags.scheduledForward);
      }
      if (direction === utils.BACKWARD_DIRECTION || direction === utils.BOTH_DIRECTION) {
        tags.push(context.tags.scheduledBackward);
      }
      if (tags.length) {
        unsafe.doNotInvokeSequentiallyOnSameTiddler.addTagsToTiddler(instance, tags);
      }
    });
  }

  // tested
  exports.unschedule = function (ref, direction, idle, widget) {
    const alertMsg = "%1 cannot be empty";
    const logger = new $tw.utils.Logger("SRS:unschedule");
    const context = {
      tags: cache.getTags([]),
      wikiUtils: utils.getWikiUtils(widget.wiki)
    };
    const supportedDirections = utils.getSupportedDirections();
    ref = utils.trimToUndefined(ref);
    if (!ref) {
      logger.alert(utils.format(alertMsg, "ref"));
      return;
    }
    direction = utils.trimToUndefined(direction);
    if (!direction || !supportedDirections.includes(direction)) {
      logger.alert(utils.format(alertMsg + " and should be one of %2", "direction", supportedDirections));
      return;
    }
    if (idle) {
      console.log("SRS:unschedule", idle, ref, direction);
      return;
    }
    context.wikiUtils.doWithTiddlerInstance(ref, (instance, unsafe) => {
      if (!instance) return;
      const tags = [];
      if (direction === utils.FORWARD_DIRECTION || direction === utils.BOTH_DIRECTION) {
        tags.push(context.tags.scheduledForward);
      }
      if (direction === utils.BACKWARD_DIRECTION || direction === utils.BOTH_DIRECTION) {
        tags.push(context.tags.scheduledBackward);
      }
      if (tags.length) {
        unsafe.doNotInvokeSequentiallyOnSameTiddler.deleteTagsToTiddler(instance, tags);
      }
    });
  }

  // under testing
  exports.createSession = function (ref, src, direction, limit, groupFilter, groupStrategy, log, idle, widget) {
    const alertMsg = "%1 cannot be empty";
    const logger = new $tw.utils.Logger("SRS:createSession");
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki)
    };
    ref = utils.trimToUndefined(ref);
    if (!ref) {
      logger.alert(utils.format(alertMsg, "ref"));
      return;
    }
    src = utils.trimToUndefined(src);
    if (!src) {
      logger.alert(utils.format(alertMsg, "src"));
      return;
    }
    direction = utils.trimToUndefined(direction);
    if (!direction || !utils.getSupportedDirections().includes(direction)) {
      direction = utils.BOTH_DIRECTION;
    }
    limit = utils.trimToUndefined(limit);
    var limitValue = limit ? utils.parseNumber(limit, 100) : 100;
    groupFilter = utils.trimToUndefined(groupFilter);
    groupStrategy = utils.trimToUndefined(groupStrategy);
    if (idle) {
      console.log("SRS:createSession", idle, ref, src, direction, limit, limitValue, groupFilter, groupStrategy);
      return;
    }
    const first = session.getFirst(src, direction, groupFilter, groupStrategy, log);
    const nextSteps = first.entry ? getNextStepsForTiddlerTitle(first.entry.src, first.entry.direction, context) : undefined;
    const data = {};
    data["src"] = src;
    data["direction"] = direction;
    data["limit"] = limitValue;
    data["groupFilter"] = groupFilter;
    data["groupStrategy"] = groupStrategy;
    data["current-src"] = first.entry ? first.entry.src : undefined;
    data["current-direction"] = first.entry ? first.entry.direction : undefined;
    data["current-due"] = first.entry ? first.entry.due : undefined;
    data["counter-repeat"] = first.counters.repeat;
    data["counter-overdue"] = first.counters.overdue;
    data["counter-newcomer"] = first.counters.newcomer;
    data["next-step-reset"] = nextSteps ? nextSteps.reset : undefined;
    data["next-step-hold"] = nextSteps ? nextSteps.hold : undefined;
    data["next-step-onward"] = nextSteps ? nextSteps.onward : undefined;
    data["estimatedEndTime"] = calculateEstimatedEndTime(first.counters);
    data["created"] = new Date().getTime();
    context.wikiUtils.doWithTiddlerInstance(ref, (instance, unsafe) => {
      unsafe.doNotInvokeSequentiallyOnSameTiddler.setTiddlerData(instance, data);
    });
  };

  // under testing
  exports.commitAnswer = function (ref, src, direction, answer, log, idle, widget) {
    const alertMsg = "%1 cannot be empty";
    const logger = new $tw.utils.Logger("SRS:commitAnswer");
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki)
    };
    ref = utils.trimToUndefined(ref);
    if (!ref) {
      logger.alert(utils.format(alertMsg, "ref"));
      return;
    }
    if (!context.wikiUtils.doWithTiddlerInstance(ref, instance => !!instance)) {
      logger.alert("SRS session not found: " + ref);
      return;
    }
    src = utils.trimToUndefined(src);
    if (!src) {
      logger.alert(utils.format(alertMsg, "src"));
      return;
    }
    direction = utils.trimToUndefined(direction);
    if (!direction) {
      logger.alert(utils.format(alertMsg, "direction"));
      return;
    }
    if (!utils.getAnswerDirections().includes(direction)) {
      logger.alert("Unsupported direction: " + direction);
      return;
    }
    answer = utils.trimToUndefined(answer);
    if (!answer) {
      logger.alert(utils.format(alertMsg, "answer"));
      return;
    }
    if (!utils.getSupportedAnswers().includes(answer)) {
      logger.alert("Unsupported answer: " + answer);
      return;
    }
    if (idle) {
      console.log("SRS:commitAnswer", idle, ref, src, direction, answer);
      return;
    }
    const newDue = context.wikiUtils.doWithTiddlerInstance(src, (instance, unsafe) => {
      if (!instance) {
        logger.alert("Source tiddler not found: " + src);
        return undefined;
      }
      return updateSrsFields(instance, direction, answer);
    });
    if (!newDue) return;
    const next = session.acceptAnswerAndGetNext(src, newDue, log);
    const nextSteps = next.entry ? getNextStepsForTiddlerTitle(next.entry.src, next.entry.direction) : undefined;
    const data = {};
    data["current-src"] = next.entry ? next.entry.src : undefined;
    data["current-direction"] = next.entry ? next.entry.direction : undefined;
    data["current-due"] = next.entry ? next.entry.due : undefined;
    data["counter-repeat"] = next.counters.repeat;
    data["counter-overdue"] = next.counters.overdue;
    data["counter-newcomer"] = next.counters.newcomer;
    data["next-step-reset"] = nextSteps ? nextSteps.reset : undefined;
    data["next-step-hold"] = nextSteps ? nextSteps.hold : undefined;
    data["next-step-onward"] = nextSteps ? nextSteps.onward : undefined;
    data["estimatedEndTime"] = calculateEstimatedEndTime(next.counters);
    data["modified"] = new Date().getTime();
    context.wikiUtils.doWithTiddlerInstance(ref, (instance, unsafe) => {
      unsafe.doNotInvokeSequentiallyOnSameTiddler.setTiddlerData(instance, data);
    });
  };

  // all spaced repetition calcualtion logic is here
  // if currentStep is undefined, it should return default steps
  function getNextSteps(currentStep) {
    const minimalStep = 60000;// TODO get mimnimal step from settings
    const s = currentStep || minimalStep;
    return {
      reset: minimalStep,
      hold: s,
      onward: s * 2 + 1 // TODO get factors from settings
    };
  }

  function getSrsFieldsNames(direction) {
    return {
      dueField: direction === utils.FORWARD_DIRECTION ? utils.SRS_FORWARD_DUE_FIELD : utils.SRS_BACKWARD_DUE_FIELD,
      lastField: direction === utils.FORWARD_DIRECTION ? utils.SRS_FORWARD_LAST_FIELD : utils.SRS_BACKWARD_LAST_FIELD
    };
  }

  function getNextStepsForTiddler(tiddler, srsFieldsNames) {
    if (!tiddler || !srsFieldsNames) return undefined;
    const due = utils.parseInteger(tiddler.fields[srsFieldsNames.dueField]);
    const last = utils.parseInteger(tiddler.fields[srsFieldsNames.lastField]);
    return (due && last) ? getNextSteps(due - last) : getNextSteps();
  }

  function getNextStepsForTiddlerTitle(tiddlerTitle, direction, context) {
    context.wikiUtils.doWithTiddlerInstance(tiddlerTitle, instance => {
      return getNextStepsForTiddler(instance, getSrsFieldsNames(direction));
    })
  }

  function updateSrsFields(tiddler, direction, answer, context) {
    const srsFieldsNames = getSrsFieldsNames(direction);
    const nextSteps = getNextStepsForTiddler(tiddler, srsFieldsNames);
    const now = new Date().getTime();
    const newDue = new Date(answer === utils.SRS_ANSWER_HOLD ? now + nextSteps.hold
      : answer === utils.SRS_ANSWER_ONWARD ? now + nextSteps.onward
        : now + nextSteps.reset).getTime();
    storeSrsFields(tiddler, srsFieldsNames, newDue, now, context);
    return newDue;
  }

  function storeSrsFields(tiddler, srsFieldsNames, newDue, newLast, context) {
    const fields = {};
    fields[srsFieldsNames.dueField] = newDue;
    fields[srsFieldsNames.lastField] = newLast;
    context.wikiUtils.doWithTiddlerInstance(tiddler, (instance, unsafe) => {
      unsafe.doNotInvokeSequentiallyOnSameTiddler.updateTiddler(instance, fields);
    })
  }

  function calculateEstimatedEndTime(counters) {
    return (counters.repeat + counters.overdue + counters.newcomer) * 10000 + new Date().getTime();
  }

})();
