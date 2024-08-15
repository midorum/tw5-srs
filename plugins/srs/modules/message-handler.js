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

  const utils = require("$:/plugins/midorum/srs/modules/utils.js").srsUtils;
  const cache = require("$:/plugins/midorum/srs/modules/cache.js");
  const SCHEDULING_CONFIGURATION_PREFIX = "$:/config/midorum/srs/scheduling";

  const Session = function (src, direction, groupFilter, groupStrategy, groupListFilter, groupLimit, resetAfter, context) {
    const self = this;
    const _comparator = (a, b) => a.due - b.due;
    const _now = () => new Date().getTime();
    var _context = {
      tags: cache.getTags(["scheduledForward", "scheduledBackward"]),
      wikiUtils: context.wikiUtils
    };
    var _src = src;
    var _takeForward = direction === utils.FORWARD_DIRECTION || direction === utils.BOTH_DIRECTION;
    var _takeBackward = direction === utils.BACKWARD_DIRECTION || direction === utils.BOTH_DIRECTION;
    var _groupFilter = groupFilter && groupStrategy ? groupFilter : undefined;
    var _groupStrategy = groupFilter && groupStrategy ? groupStrategy : undefined;
    var _groupListFilter = groupListFilter && groupFilter && groupStrategy ? groupListFilter : undefined;
    var _groupLimit = groupLimit && groupListFilter && groupFilter && groupStrategy ? groupLimit : undefined;
    const _resetAfter = resetAfter && resetAfter > 0 ? resetAfter * 60000 : resetAfter === 0 || resetAfter === -1 ? 86400000 : 600000;
    const _resetWhenEmpty = resetAfter === -1;
    var _ttl;
    var _repeat = [];
    var _overdue = [];
    var _newcomer = [];
    var _groups = [];
    var _current;

    function getForwardEntry(tiddler) {
      if (!tiddler.getTiddlerTagsShallowCopy().includes(_context.tags.scheduledForward)) return undefined;
      return {
        due: utils.parseInteger(tiddler.getTiddlerField(utils.SRS_FORWARD_DUE_FIELD)),
        direction: utils.FORWARD_DIRECTION,
        src: tiddler.getTitle()
      };
    }

    function getBackwardEntry(tiddler) {
      if (!tiddler.getTiddlerTagsShallowCopy().includes(_context.tags.scheduledBackward)) return undefined;
      return {
        due: utils.parseInteger(tiddler.getTiddlerField(utils.SRS_BACKWARD_DUE_FIELD)),
        direction: utils.BACKWARD_DIRECTION,
        src: tiddler.getTitle()
      };
    }

    function refill() {
      const now = _now();
      _repeat = [];
      _overdue = [];
      _newcomer = [];
      if (_groupStrategy === "nFromGroup") {
        checkGroupsOverEachItem(now); // groups may contain the item
      } else {
        checkGroupsUnderEachItem(now); // the item may contain groups
      }
      _overdue.sort(_comparator);
      _ttl = now + _resetAfter;
    }

    function checkGroupsUnderEachItem(now) {
      const getGroupForTitle = (title) => {
        if (!_groupFilter) return undefined;
        return _context.wikiUtils.filterTiddlers(_groupFilter.replaceAll("<currentTiddler>", "[" + title + "]"));
      }
      const searchGroup = (groupForTitle) => {
        if (!groupForTitle) return false;
        return _groups.findIndex(group => utils.arraysAreEqual(group, groupForTitle)) !== -1;
      }
      const pushGroup = (groupForTitle, groupIsFound) => {
        if (_groupFilter && groupForTitle && !groupIsFound) _groups.push(groupForTitle);
      }
      const groupStrategyIsSatisfied = (groupForTitle, groupIsFound) => {
        if (!groupForTitle) return true;
        if (_groupStrategy === "groupOnly") {
          return groupForTitle.length !== 0; // the tiddler belongs the group
        }
        if (_groupStrategy === "notInGroup") {
          return groupForTitle.length === 0; // the tiddler does not belong the group
        }
        if (_groupStrategy === "oneFromGroup") {
          return !groupIsFound; // this is the second found tiddler from the group
        }
        return true;
      }
      _context.wikiUtils.allTitlesWithTag(_src)
        .forEach(title => {
          const groupForTitle = getGroupForTitle(title);
          const groupIsFound = searchGroup(groupForTitle);
          if (!groupStrategyIsSatisfied(groupForTitle, groupIsFound)) return;
          const tiddler = _context.wikiUtils.withTiddler(title);
          if (_takeForward) {
            const forwardEntry = getForwardEntry(tiddler);
            if (forwardEntry) {
              if (!forwardEntry.due) {
                _newcomer.push(forwardEntry);
                pushGroup(groupForTitle, groupIsFound);
                return; // if we have taken forward we skip backward for same source
              } else if (forwardEntry.due <= now) {
                _overdue.push(forwardEntry);
                pushGroup(groupForTitle, groupIsFound);
                return; // if we have taken forward we skip backward for same source
              }
            }
          }
          if (_takeBackward) {
            const backwardEntry = getBackwardEntry(tiddler);
            if (backwardEntry) {
              if (!backwardEntry.due) {
                _newcomer.push(backwardEntry);
                pushGroup(groupForTitle, groupIsFound);
              } else if (backwardEntry.due <= now) {
                _overdue.push(backwardEntry);
                pushGroup(groupForTitle, groupIsFound);
              }
            }
          }
        });
    }

    function checkGroupsOverEachItem(now) {
      const getGroupList = () => {
        if (!_groupListFilter) return undefined;
        return _context.wikiUtils.filterTiddlers(_groupListFilter);
      }
      const groupContainsTitle = (group, title) => {
        if (!_groupFilter) return undefined;
        return _context.wikiUtils.filterTiddlers(_groupFilter.replaceAll("<groupTitle>", "[" + group + "]").replaceAll("<currentTiddler>", "[" + title + "]"));
      }
      const groupList = getGroupList();
      if (!groupList.length) throw "group list is empty"
      const groupMap = {};
      _context.wikiUtils.allTitlesWithTag(_src)
        .forEach(title => {
          for (const group of groupList) {
            if (groupMap[group] && groupMap[group] >= _groupLimit) continue;
            const titleIsInGroup = groupContainsTitle(group, title);
            if (!titleIsInGroup.length) continue;
            const tiddler = _context.wikiUtils.withTiddler(title);
            if (_takeForward) {
              const forwardEntry = getForwardEntry(tiddler);
              if (forwardEntry) {
                if (!forwardEntry.due) {
                  _newcomer.push(forwardEntry);
                  groupMap[group] = (groupMap[group] || 0) + 1;
                  return; // if we have taken forward we skip backward for same source
                } else if (forwardEntry.due <= now) {
                  _overdue.push(forwardEntry);
                  groupMap[group] = (groupMap[group] || 0) + 1;
                  return; // if we have taken forward we skip backward for same source
                }
              }
            }
            if (_takeBackward) {
              const backwardEntry = getBackwardEntry(tiddler);
              if (backwardEntry) {
                if (!backwardEntry.due) {
                  _newcomer.push(backwardEntry);
                  groupMap[group] = (groupMap[group] || 0) + 1;
                  return; // if we have taken the tiddler we skip checking other groups for it
                } else if (backwardEntry.due <= now) {
                  _overdue.push(backwardEntry);
                  groupMap[group] = (groupMap[group] || 0) + 1;
                  return; // if we have taken the tiddler we skip checking other groups for it
                }
              }
            }
          }
        });
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

    function acceptAnswer(src, newDue, answer) {
      if(answer === utils.SRS_ANSWER_EXCLUDE) {
        _current = undefined;
        return;
      }
      if (newDue > _ttl || _current.src !== src) return;
      _current.due = newDue;
      _repeat.push(_current);
      _repeat.sort(_comparator);
      _current = undefined;
    }

    function counters() {
      return {
        repeat: _repeat.length,
        overdue: _overdue.length,
        newcomer: _newcomer.length
      };
    }

    function _log() {
      console.log("SRS:session",
        "\n_src", _src,
        "\n_takeForward", _takeForward,
        "\n_takeBackward", _takeBackward,
        "\n_groupStrategy", _groupStrategy,
        "\n_groupListFilter", _groupListFilter,
        "\n_groupFilter", _groupFilter,
        "\n_groupLimit", _groupLimit,
        "\n_resetAfter", _resetAfter,
        "\n_resetWhenEmpty", _resetWhenEmpty,
        "\n_ttl", _ttl,
        "\n_repeat", _repeat,
        "\n_overdue", _overdue,
        "\n_newcomer", _newcomer,
        "\n_groups", _groups,
        "\n_current", _current
      );
    }

    console.log("A new SRS session created:"
      + "\nsrc: " + src
      + "\ndirection: " + direction
      + "\ngroupStrategy: " + _groupStrategy
      + "\ngroupListFilter: " + _groupListFilter
      + "\ngroupFilter: " + _groupFilter
      + "\ngroupLimit: " + _groupLimit
      + "\nresetAfter: " + _resetAfter
      + "\nresetWhenEmpty: " + _resetWhenEmpty
    );

    return {
      getFirst: function (log) {
        refill();
        if (log) _log();
        else _groups.length = 0;
        return {
          entry: next(),
          counters: counters()
        };
      },
      acceptAnswerAndGetNext: function (src, newDue, answer, log) {
        if (_now() < _ttl) {
          acceptAnswer(src, newDue, answer);
        } else {
          refill();
        }
        var entry = next();
        if(_resetWhenEmpty && !entry) {
          refill();
          entry = next();
        }
        if (log) _log();
        else _groups.length = 0;
        return {
          entry: entry,
          counters: counters()
        };
      },
      getCurrent: () => {
        return {
          due: _current.due,
          direction: _current.direction,
          src: _current.src
        };
      }
    }

  };

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
      logger.alert(utils.formatString(alertMsg, "ref"));
      return;
    }
    direction = utils.trimToUndefined(direction);
    if (!direction || !supportedDirections.includes(direction)) {
      logger.alert(utils.formatString(alertMsg + " and should be one of %2", "direction", supportedDirections));
      return;
    }
    if (idle) {
      console.log("SRS:schedule", idle, ref, direction);
      return;
    }
    const tags = [];
    if (direction === utils.FORWARD_DIRECTION || direction === utils.BOTH_DIRECTION) {
      tags.push(context.tags.scheduledForward);
    }
    if (direction === utils.BACKWARD_DIRECTION || direction === utils.BOTH_DIRECTION) {
      tags.push(context.tags.scheduledBackward);
    }
    if (tags.length) {
      context.wikiUtils.withTiddler(ref).doNotInvokeSequentiallyOnSameTiddler.addTagsToTiddler(tags);
    }
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
      logger.alert(utils.formatString(alertMsg, "ref"));
      return;
    }
    direction = utils.trimToUndefined(direction);
    if (!direction || !supportedDirections.includes(direction)) {
      logger.alert(utils.formatString(alertMsg + " and should be one of %2", "direction", supportedDirections));
      return;
    }
    if (idle) {
      console.log("SRS:unschedule", idle, ref, direction);
      return;
    }
    const tags = [];
    if (direction === utils.FORWARD_DIRECTION || direction === utils.BOTH_DIRECTION) {
      tags.push(context.tags.scheduledForward);
    }
    if (direction === utils.BACKWARD_DIRECTION || direction === utils.BOTH_DIRECTION) {
      tags.push(context.tags.scheduledBackward);
    }
    if (tags.length) {
      context.wikiUtils.withTiddler(ref).doNotInvokeSequentiallyOnSameTiddler.deleteTagsToTiddler(tags);
    }
  }

  // tested
  exports.createSession = function (params, widget) {
    const alertMsg = "%1 cannot be empty";
    const logger = new $tw.utils.Logger("SRS:createSession");
    const context = {
      tags: cache.getTags([]),
      wikiUtils: utils.getWikiUtils(widget.wiki)
    };
    const ref = utils.trimToUndefined(params.ref);
    if (!ref) {
      logger.alert(utils.formatString(alertMsg, "ref"));
      return;
    }
    const src = utils.trimToUndefined(params.src);
    if (!src) {
      logger.alert(utils.formatString(alertMsg, "src"));
      return;
    }
    var direction = utils.trimToUndefined(params.direction);
    const supportedDirections = utils.getSupportedDirections();
    if (!direction) {
      direction = utils.BOTH_DIRECTION;
    } else if (!supportedDirections.includes(direction)) {
      logger.alert("direction argument should be one of [" + supportedDirections + "]");
      return;
    }
    const limit = utils.trimToUndefined(params.limit);
    const limitValue = limit ? utils.parseInteger(limit, 100) : 100;
    const groupFilter = utils.trimToUndefined(params.groupFilter);
    const groupStrategy = utils.trimToUndefined(params.groupStrategy);
    const groupListFilter = utils.trimToUndefined(params.groupListFilter);
    const groupLimit = params.groupLimit ? utils.parseInteger(params.groupLimit, 0) : 0;
    const resetAfter = params.resetAfter ? utils.parseInteger(params.resetAfter, 10) : 10;
    if (params.idle) {
      console.log("SRS:createSession", params.idle, ref, src, direction, limit, limitValue, groupFilter, groupStrategy, groupListFilter, groupLimit, resetAfter);
      return;
    }
    const session = new Session(src, direction, groupFilter, groupStrategy, groupListFilter, groupLimit, resetAfter, context);
    widget.wiki["srs-session"] = session;
    const first = session.getFirst(params.log);
    // const first = session.getFirst(src, direction, groupFilter, groupStrategy, log, context);
    const nextSteps = first.entry ? getNextStepsForTiddler(context.wikiUtils.withTiddler(first.entry.src), getSrsFieldsNames(first.entry.direction, context), context) : undefined;
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
    context.wikiUtils.withTiddler(ref).doNotInvokeSequentiallyOnSameTiddler.setOrCreateTiddlerData(data);
  };

  exports.deleteSession = function (ref, idle, widget) {
    const alertMsg = "%1 cannot be empty";
    const logger = new $tw.utils.Logger("SRS:deleteSession");
    const context = {
      tags: cache.getTags([]),
      wikiUtils: utils.getWikiUtils(widget.wiki)
    };
    ref = utils.trimToUndefined(ref);
    if (!ref) {
      logger.alert(utils.formatString(alertMsg, "ref"));
      return;
    }
    const session = widget.wiki["srs-session"];
    if (!session) {
      logger.alert("SRS session not found.");
      return;
    }
    if (idle) {
      console.log("SRS:deleteSession", idle, ref, src, direction, limit, limitValue, groupFilter, groupStrategy);
      return;
    }
    widget.wiki["srs-session"] = undefined;
  }

  // tested
  exports.commitAnswer = function (ref, answer, log, idle, widget) {
    const alertMsg = "%1 cannot be empty";
    const logger = new $tw.utils.Logger("SRS:commitAnswer");
    const context = {
      tags: cache.getTags([]),
      wikiUtils: utils.getWikiUtils(widget.wiki)
    };
    ref = utils.trimToUndefined(ref);
    if (!ref) {
      logger.alert(utils.formatString(alertMsg, "ref"));
      return;
    }
    answer = utils.trimToUndefined(answer);
    if (!answer) {
      logger.alert(utils.formatString(alertMsg, "answer"));
      return;
    }
    const supportedAnswers = utils.getSupportedAnswers();
    if (!supportedAnswers.includes(answer)) {
      logger.alert("answer argument should be one of [" + supportedAnswers + "]");
      return;
    }
    if (idle) {
      console.log("SRS:commitAnswer", idle, ref, src, direction, answer);
      return;
    }
    if (!context.wikiUtils.withTiddler(ref).exists()) {
      logger.alert("SRS session not found: " + ref);
      return;
    }
    const session = widget.wiki["srs-session"];
    if (!session) {
      logger.alert("SRS session not found.");
      return;
    }
    const asked = session.getCurrent();
    const srcTiddler = context.wikiUtils.withTiddler(asked.src);
    if (!srcTiddler.exists()) {
      logger.alert("Source tiddler not found: " + asked.src);
      return;
    }
    const newDue = updateSrsFields(srcTiddler, asked.direction, answer, context);
    const next = session.acceptAnswerAndGetNext(asked.src, newDue, answer, log);
    const nextSteps = next.entry ? getNextStepsForTiddler(context.wikiUtils.withTiddler(next.entry.src), getSrsFieldsNames(next.entry.direction, context), context) : undefined;
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
    context.wikiUtils.withTiddler(ref).doNotInvokeSequentiallyOnSameTiddler.setOrCreateTiddlerData(data);
  };

  // all spaced repetition calcualtion logic is here
  // if currentStep is undefined, it should return default steps
  function getNextSteps(currentStep, context) {
    const strategy = context.wikiUtils.withTiddler(SCHEDULING_CONFIGURATION_PREFIX + "/strategy").getTiddlerField("text");
    if (strategy === "linear") return getLinearStrategyNextSteps(currentStep, context);
    if (strategy === "two-factor-linear") return getTwoFactorLinearStrategyNextSteps(currentStep, context);
    throw new Error("uknown strategy: " + strategy);
  }

  function getLinearStrategyNextSteps(currentStep, context) {
    function getSchedulingOptions(context) {
      const strategyConfigurationPrefix = SCHEDULING_CONFIGURATION_PREFIX + "/linear";
      const minimalStep = utils.parseInteger(context.wikiUtils.withTiddler(strategyConfigurationPrefix + "/minimalStep").getTiddlerField("text"), 60);
      const factor = $tw.utils.parseNumber(context.wikiUtils.withTiddler(strategyConfigurationPrefix + "/factor").getTiddlerField("text")) || 2.0;
      return {
        minimalStep: (minimalStep >= 1 ? minimalStep : 60) * 1000,
        factor: factor >= 1 ? factor : 2.0
      }
    }
    const schedulingOptions = getSchedulingOptions(context);
    const s = currentStep || schedulingOptions.minimalStep;
    return {
      reset: schedulingOptions.minimalStep,
      hold: s,
      onward: s * schedulingOptions.factor + 1
    };
  }

  function getTwoFactorLinearStrategyNextSteps(currentStep, context) {
    function getSchedulingOptions(context) {
      const strategyConfigurationPrefix = SCHEDULING_CONFIGURATION_PREFIX + "/two-factor-linear";
      const minimalStep = utils.parseInteger(context.wikiUtils.withTiddler(strategyConfigurationPrefix + "/minimalStep").getTiddlerField("text"), 60);
      const shortFactor = $tw.utils.parseNumber(context.wikiUtils.withTiddler(strategyConfigurationPrefix + "/short-factor").getTiddlerField("text")) || 10.0;
      const longFactorRatio = $tw.utils.parseNumber(context.wikiUtils.withTiddler(strategyConfigurationPrefix + "/long-factor-ratio").getTiddlerField("text")) || 2.0;
      const pivot = utils.parseInteger(context.wikiUtils.withTiddler(strategyConfigurationPrefix + "/pivot").getTiddlerField("text"), 86400);
      const sf = shortFactor >= 1 ? shortFactor : 10.0;
      return {
        minimalStep: (minimalStep >= 1 ? minimalStep : 60) * 1000,
        shortFactor: sf,
        longFactorRatio: longFactorRatio >= 1 && longFactorRatio <= sf ? longFactorRatio : sf <= 2.0 ? 1.0 : 2.0,
        pivot: (pivot >= 1 ? pivot : 86400) * 1000
      }
    }
    const schedulingOptions = getSchedulingOptions(context);
    const s = currentStep || schedulingOptions.minimalStep;
    return {
      reset: schedulingOptions.minimalStep,
      hold: s,
      onward: (s < schedulingOptions.pivot ? s * schedulingOptions.shortFactor : s * schedulingOptions.shortFactor / schedulingOptions.longFactorRatio) + 1
    };
  }

  function getSrsFieldsNames(direction, context) {
    return {
      tag: direction === utils.FORWARD_DIRECTION ? context.tags.scheduledForward : context.tags.scheduledBackward,
      dueField: direction === utils.FORWARD_DIRECTION ? utils.SRS_FORWARD_DUE_FIELD : utils.SRS_BACKWARD_DUE_FIELD,
      lastField: direction === utils.FORWARD_DIRECTION ? utils.SRS_FORWARD_LAST_FIELD : utils.SRS_BACKWARD_LAST_FIELD
    };
  }

  function getNextStepsForTiddler(tiddler, srsFieldsNames, context) {
    if (!tiddler || !srsFieldsNames) return undefined;
    const due = utils.parseInteger(tiddler.getTiddlerField(srsFieldsNames.dueField));
    const last = utils.parseInteger(tiddler.getTiddlerField(srsFieldsNames.lastField));
    return (due && last) ? getNextSteps(due - last, context) : getNextSteps(undefined, context);
  }

  function updateSrsFields(tiddler, direction, answer, context) {
    const srsFieldsNames = getSrsFieldsNames(direction, context);
    const nextSteps = getNextStepsForTiddler(tiddler, srsFieldsNames, context);
    const now = new Date().getTime();
    const newDue = new Date(answer === utils.SRS_ANSWER_HOLD ? now + randomlyDecreaseValue(nextSteps.hold, nextSteps.reset)
      : answer === utils.SRS_ANSWER_ONWARD ? now + randomlyDecreaseValue(nextSteps.onward, nextSteps.reset)
        : now + nextSteps.reset).getTime();
    storeSrsFields(tiddler, srsFieldsNames, newDue, now, answer === utils.SRS_ANSWER_EXCLUDE, context);
    return newDue;
  }

  function storeSrsFields(tiddler, srsFieldsNames, newDue, newLast, removeTag, context) {
    const fields = {};
    fields[srsFieldsNames.dueField] = newDue;
    fields[srsFieldsNames.lastField] = newLast;
    if(removeTag) {
      fields.tags = utils.purgeArray(tiddler.getTiddlerTagsShallowCopy(), [srsFieldsNames.tag]);
    }
    tiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler(fields);
  }

  function calculateEstimatedEndTime(counters) {
    return (counters.repeat + counters.overdue + counters.newcomer) * 10000 + new Date().getTime();
  }

  function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randomlyDecreaseValue(value, min) {
    if (value <= min) return value;
    return value * getRandomArbitrary(0.9, 1);
  }

})();
