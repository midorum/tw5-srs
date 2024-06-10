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

  const Session = function (src, direction, groupFilter, groupStrategy, context) {
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
          const tiddler = _context.wikiUtils.withTiddler(title);
          if (_takeForward) {
            const forwardEntry = getForwardEntry(tiddler);
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
            const backwardEntry = getBackwardEntry(tiddler);
            if (backwardEntry) {
              if (!backwardEntry.due) {
                _newcomer.push(backwardEntry);
              } else if (backwardEntry.due <= now) {
                _overdue.push(backwardEntry);
              }
            }
          }
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

    console.log("A new SRS session created:"
      + "\nsrc: " + src
      + "\ndirection: " + direction
      + "\ngroupFilter: " + _groupFilter
      + "\ngroupStrategy: " + _groupStrategy
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
  exports.createSession = function (ref, src, direction, limit, groupFilter, groupStrategy, log, idle, widget) {
    const alertMsg = "%1 cannot be empty";
    const logger = new $tw.utils.Logger("SRS:createSession");
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki)
    };
    ref = utils.trimToUndefined(ref);
    if (!ref) {
      logger.alert(utils.formatString(alertMsg, "ref"));
      return;
    }
    src = utils.trimToUndefined(src);
    if (!src) {
      logger.alert(utils.formatString(alertMsg, "src"));
      return;
    }
    direction = utils.trimToUndefined(direction);
    const supportedDirections = utils.getSupportedDirections();
    if (!direction) {
      direction = utils.BOTH_DIRECTION;
    } else if (!supportedDirections.includes(direction)) {
      logger.alert("direction argument should be one of [" + supportedDirections + "]");
      return;
    }
    limit = utils.trimToUndefined(limit);
    const limitValue = limit ? utils.parseInteger(limit, 100) : 100;
    groupFilter = utils.trimToUndefined(groupFilter);
    groupStrategy = utils.trimToUndefined(groupStrategy);
    if (idle) {
      console.log("SRS:createSession", idle, ref, src, direction, limit, limitValue, groupFilter, groupStrategy);
      return;
    }
    const session = new Session(src, direction, groupFilter, groupStrategy, context);
    widget.wiki["srs-session"] = session;
    const first = session.getFirst(log);
    // const first = session.getFirst(src, direction, groupFilter, groupStrategy, log, context);
    const nextSteps = first.entry ? getNextStepsForTiddler(context.wikiUtils.withTiddler(first.entry.src), getSrsFieldsNames(first.entry.direction), context) : undefined;
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
    const next = session.acceptAnswerAndGetNext(asked.src, newDue, log);
    // const next = session_deprecated.acceptAnswerAndGetNext(asked.src, newDue, log);
    const nextSteps = next.entry ? getNextStepsForTiddler(context.wikiUtils.withTiddler(next.entry.src), getSrsFieldsNames(next.entry.direction), context) : undefined;
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
    const linearSchedulingConfiguration = SCHEDULING_CONFIGURATION_PREFIX + "/linear";
    const minimalStep = utils.parseInteger(context.wikiUtils.withTiddler(linearSchedulingConfiguration + "/minimalStep").getTiddlerField("text"), 60000);
    const factor = utils.parseInteger(context.wikiUtils.withTiddler(linearSchedulingConfiguration + "/factor").getTiddlerField("text"), 2);
    const s = currentStep || minimalStep;
    return {
      reset: minimalStep,
      hold: s,
      onward: s * factor + 1 
    };
  }

  function getSrsFieldsNames(direction) {
    return {
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
    const srsFieldsNames = getSrsFieldsNames(direction);
    const nextSteps = getNextStepsForTiddler(tiddler, srsFieldsNames, context);
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
    tiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler(fields);
  }

  function calculateEstimatedEndTime(counters) {
    return (counters.repeat + counters.overdue + counters.newcomer) * 10000 + new Date().getTime();
  }

})();
