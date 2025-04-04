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

  const Session = function (src, direction, limit, groupFilter, groupStrategy, groupListFilter, groupLimit, resetAfter, newFirst, listProvider, context) {
    const self = this;
    const _comparator = (a, b) => a.due - b.due;
    const _now = () => new Date().getTime();
    var _context = {
      tags: cache.getTags(["scheduledForward", "scheduledBackward"]),
      wikiUtils: context.wikiUtils,
      env: context.env,
      logger: context.logger
    };
    var _src = src;
    var _takeForward = direction === utils.FORWARD_DIRECTION || direction === utils.BOTH_DIRECTION;
    var _takeBackward = direction === utils.BACKWARD_DIRECTION || direction === utils.BOTH_DIRECTION;
    var _groupFilter = groupFilter && groupStrategy ? groupFilter : undefined;
    var _groupListFilter = groupListFilter && groupStrategy ? groupListFilter : undefined;
    var _groupStrategy = groupStrategy && (groupFilter || groupListFilter || listProvider) ? groupStrategy : undefined;
    var _groupLimit = groupLimit && groupListFilter ? groupLimit : undefined;
    const _resetAfter = resetAfter && resetAfter > 0 ? resetAfter * 60000 : resetAfter === 0 || resetAfter === -1 ? 86400000 : 600000;
    const _resetWhenEmpty = resetAfter === -1;
    const _listProvider = listProvider && _context.env.macros[listProvider] ? _context.env.macros[listProvider] : undefined;
    var _ttl;
    var _repeat = [];
    var _overdue = [];
    var _newcomer = [];
    var _groups = [];
    var _current;

    const ProxyWiki = function (wiki) {
      return {
        SRS_BASE_TIME: utils.SRS_BASE_TIME,
        getTitlesWithTag: (tag) => wiki.getTiddlersWithTag(tag),
        filterTitles: (filterString) => wiki.filterTiddlers(filterString),
        allTitles: () => wiki.allTitles(),
        allShadowTitles: () => wiki.allShadowTitles(),
        tiddlerExists: (title) => wiki.tiddlerExists(title),
        isShadowTiddler: (title) => wiki.isShadowTiddler(title),
        getTiddler: (title) => wiki.getTiddler(title),
        getSrsData: (titleOrTiddler) => getSrsData(_context.wikiUtils.withTiddler(titleOrTiddler))
      };
    };

    function getSrsData(tiddler) {
      const title = tiddler.getTitle();
      const tags = tiddler.getTiddlerTagsShallowCopy();
      return {
        forward: tags.includes(_context.tags.scheduledForward) ? {
          due: utils.parseInteger(tiddler.getTiddlerField(utils.SRS_FORWARD_DUE_FIELD)),
          direction: utils.FORWARD_DIRECTION,
          src: title
        } : undefined,
        backward: tags.includes(_context.tags.scheduledBackward) ? {
          due: utils.parseInteger(tiddler.getTiddlerField(utils.SRS_BACKWARD_DUE_FIELD)),
          direction: utils.BACKWARD_DIRECTION,
          src: title
        } : undefined
      };
    }

    function refill() {
      const now = _now();
      _repeat = [];
      _overdue = [];
      _newcomer = [];
      if (_groupStrategy === "provided") {
        getProvidedList(now); // use the user defined macro to obtain the list of elements
      } else if (_groupStrategy === "taggedAny") {
        checkTaggedAny(now); // the item has any tag from groupListFilter
      } else if (_groupStrategy === "nFromGroup") {
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
          const srsData = getSrsData(tiddler);
          if (_takeForward) {
            const forwardEntry = srsData.forward;
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
            const backwardEntry = srsData.backward;
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
            const srsData = getSrsData(tiddler);
            if (_takeForward) {
              const forwardEntry = srsData.forward;
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
              const backwardEntry = srsData.backward;
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

    function checkTaggedAny(now) {
      if (!_groupListFilter) throw "groupListFilter should be defined";
      const groupList = _context.wikiUtils.filterTiddlers(_groupListFilter);
      if (!groupList.length) throw "group list is empty";
      var countDown = _groupLimit ? groupList.length * _groupLimit : Number.MAX_SAFE_INTEGER;
      const groupMap = {};
      const allTitles = _context.wikiUtils.allTitlesWithTag(_src);
      for (let i = 0; i < allTitles.length; i++) {
        const title = allTitles[i];
        const tiddler = _context.wikiUtils.withTiddler(title);
        const tags = tiddler.getTiddlerTagsShallowCopy();
        const intersection = utils.arraysIntersection(groupList, tags);
        if (!intersection.length) continue;
        const srsData = getSrsData(tiddler);
        const forwardEntry = srsData.forward;
        const backwardEntry = srsData.backward;
        for (let j = 0; j < intersection.length; j++) {
          const group = intersection[j];
          if (groupMap[group] && groupMap[group] >= _groupLimit) continue;
          if (_takeForward) {
            if (forwardEntry) {
              if (!forwardEntry.due) {
                _newcomer.push(forwardEntry);
                groupMap[group] = (groupMap[group] || 0) + 1;
                countDown--;
                break; // if we have taken forward we skip backward for same source
              } else if (forwardEntry.due <= now) {
                _overdue.push(forwardEntry);
                groupMap[group] = (groupMap[group] || 0) + 1;
                countDown--;
                break; // if we have taken forward we skip backward for same source
              }
            }
          }
          if (_takeBackward) {
            if (backwardEntry) {
              if (!backwardEntry.due) {
                _newcomer.push(backwardEntry);
                groupMap[group] = (groupMap[group] || 0) + 1;
                countDown--;
                break; // if we have taken the tiddler we skip checking other groups for it
              } else if (backwardEntry.due <= now) {
                _overdue.push(backwardEntry);
                groupMap[group] = (groupMap[group] || 0) + 1;
                countDown--;
                break; // if we have taken the tiddler we skip checking other groups for it
              }
            }
          }
        }
        if (countDown <= 0) break;
      }
    }

    function getProvidedList(now) {
      if (!_listProvider) throw "`listProvider` should be defined";
      const answerDirections = utils.getAnswerDirections();
      const list = _listProvider.run(new ProxyWiki(_context.wikiUtils.wiki), direction, limit, now);
      if (!Array.isArray(list)) {
        _context.logger.alert("'listProvider' (" + listProvider + ") should return an array");
        return;
      }
      for (let i = 0; i < list.length; i++) {
        const currentType = list[i]['type'];
        if (!currentType) {
          _context.logger.alert("invalid item format: missed `type` attribute but got " + JSON.stringify(list[i]));
          return;
        }
        const currentTitle = list[i]['src'];
        if (!currentTitle) {
          _context.logger.alert("invalid item format: missed `src` attribute but got " + JSON.stringify(list[i]));
          return;
        }
        const currentDirection = list[i]['direction'];
        if (!currentDirection) {
          _context.logger.alert("invalid item format: missed `direction` attribute but got " + JSON.stringify(list[i]));
          return;
        } else if (!answerDirections.includes(currentDirection)) {
          _context.logger.alert("item direction should be one of [" + answerDirections + "] but got " + JSON.stringify(list[i]));
          return;
        }
        const tiddler = _context.wikiUtils.withTiddler(currentTitle);
        const srsData = getSrsData(tiddler);
        const entry = currentDirection === utils.FORWARD_DIRECTION ? srsData.forward : srsData.backward;
        if (!entry) {
          _context.logger.alert("could not find a tiddler or it isn't sheduduled for item " + JSON.stringify(list[i]));
          return;
        }
        entry['type'] = currentType;
        if (entry.due && entry.due !== utils.SRS_BASE_TIME) {
          _overdue.push(entry);
        } else {
          _newcomer.push(entry);
        }
      }
    }

    function nextFromDepot() {
      if (newFirst) {
        if (_newcomer.length !== 0) return _newcomer.shift();
        if (_overdue.length !== 0) return _overdue.shift();
      } else {
        if (_overdue.length !== 0) return _overdue.shift();
        if (_newcomer.length !== 0) return _newcomer.shift();
      }
      return undefined;
    }

    function next() {
      const now = _now();
      if (_repeat.length !== 0 && _repeat[0].due <= now) {
        _current = _repeat.shift();
        return _current;
      }
      _current = nextFromDepot();
      return _current;
    }

    function acceptAnswer(src, newDue, answer) {
      if (answer === utils.SRS_ANSWER_EXCLUDE) {
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
      + "\nlistProvider: " + listProvider
      + "\nnewFirst: " + newFirst
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
        if (_resetWhenEmpty && !entry) {
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
      },
      getSrc() {
        return _src;
      }
    }

  };

  // tested
  exports.schedule = function (ref, direction, preset, idle, widget) {
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
    const tiddler = context.wikiUtils.withTiddler(ref);
    if (!tiddler.exists()) {
      logger.alert("Tiddler not found: " + ref);
      return;
    }
    if (idle) {
      console.log("SRS:schedule", idle, ref, direction, preset);
      return;
    }
    const tags = [];
    const fields = {};
    if (direction === utils.FORWARD_DIRECTION || direction === utils.BOTH_DIRECTION) {
      tags.push(context.tags.scheduledForward);
      if (preset && !tiddler.getTiddlerField(utils.SRS_FORWARD_DUE_FIELD)) {
        fields[utils.SRS_FORWARD_DUE_FIELD] = utils.SRS_BASE_TIME;
        fields[utils.SRS_FORWARD_LAST_FIELD] = utils.SRS_BASE_TIME;
      }
    }
    if (direction === utils.BACKWARD_DIRECTION || direction === utils.BOTH_DIRECTION) {
      tags.push(context.tags.scheduledBackward);
      if (preset && !tiddler.getTiddlerField(utils.SRS_BACKWARD_DUE_FIELD)) {
        fields[utils.SRS_BACKWARD_DUE_FIELD] = utils.SRS_BASE_TIME;
        fields[utils.SRS_BACKWARD_LAST_FIELD] = utils.SRS_BASE_TIME;
      }
    }
    if (tags.length) {
      const tiddlerTags = tiddler.getTiddlerTagsShallowCopy();
      fields.tags = tiddlerTags.concat(utils.purgeArray(tags, tiddlerTags));
      tiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler(fields);
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
  exports.createSession = function (params, widget, env) {
    const alertMsg = "%1 cannot be empty";
    const logger = new $tw.utils.Logger("SRS:createSession");
    const context = {
      tags: cache.getTags([]),
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: logger
    };
    const ref = utils.trimToUndefined(params.ref);
    if (!ref) {
      logger.alert(utils.formatString(alertMsg, "ref"));
      return;
    }
    const src = utils.trimToUndefined(params.src);
    const listProvider = utils.trimToUndefined(params.listProvider);
    if (listProvider) {
      if (!context.env.macros[listProvider]) {
        logger.alert("'listProvider' (" + listProvider + ") not found. Check if you defined the macro properly.");
        return;
      }
    } else if (!src) {
      logger.alert(utils.formatString(alertMsg, "src"));
      return;
    }
    var direction = utils.trimToUndefined(params.direction);
    const supportedDirections = utils.getSupportedDirections();
    if (!direction) {
      direction = utils.BOTH_DIRECTION;
    } else if (!supportedDirections.includes(direction)) {
      logger.alert("direction should be one of [" + supportedDirections + "]");
      return;
    }
    const limit = utils.trimToUndefined(params.limit);
    const limitValue = limit ? utils.parseInteger(limit, 100) : 100;
    const groupStrategy = listProvider ? "provided" : utils.trimToUndefined(params.groupStrategy);
    const groupFilter = listProvider ? undefined : utils.trimToUndefined(params.groupFilter);
    const groupListFilter = listProvider ? undefined : utils.trimToUndefined(params.groupListFilter);
    const groupLimit = params.groupLimit ? utils.parseInteger(params.groupLimit, 0) : 0;
    const resetAfter = params.resetAfter ? utils.parseInteger(params.resetAfter, 10) : 10;
    const newFirst = !!params.newFirst;
    if (params.idle) {
      console.log("SRS:createSession", params.idle, ref, src, direction, limit, limitValue, groupFilter, groupStrategy, groupListFilter, groupLimit, resetAfter);
      return;
    }
    const session = new Session(src, direction, limitValue, groupFilter, groupStrategy, groupListFilter, groupLimit, resetAfter, newFirst, listProvider, context);
    widget.wiki["srs-session"] = session;
    const first = session.getFirst(params.log);
    // const nextSteps = first.entry ? getNextStepsForTiddler(context.wikiUtils.withTiddler(first.entry.src), getSrsFieldsNames(first.entry.direction, context), context) : undefined;
    const nextSteps = first.entry ? getNextStepsForTitle(first.entry.src, first.entry.direction, context) : undefined;
    const answerRelatedFilter = first.entry ? getAnswerRelatedFilter(first.entry, session.getSrc(), context) : undefined;
    const data = {};
    data["src"] = groupStrategy === "provided" ? "provided" : src;
    data["direction"] = direction;
    data["limit"] = limitValue;
    data["groupFilter"] = groupFilter;
    data["groupStrategy"] = groupStrategy;
    data["current-src"] = first.entry ? first.entry.src : undefined;
    data["current-direction"] = first.entry ? first.entry.direction : undefined;
    data["current-due"] = first.entry ? first.entry.due : undefined;
    data["current-type"] = first.entry ? first.entry.type : undefined;
    data["current-answer-related-filter"] = answerRelatedFilter;
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
  exports.commitAnswer = function (ref, answer, updateRelated, log, idle, widget) {
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
      console.log("SRS:commitAnswer", idle, ref, direction, answer, updateRelated);
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
    const relatedTiddlers = updateRelated ? context.wikiUtils.filterTiddlers(updateRelated.replaceAll("<currentTiddler>", "[" + srcTiddler.getTitle() + "]"))
      .map(title => context.wikiUtils.withTiddler(title))
      .filter(tiddler => tiddler.exists()) : [];
    const now = new Date().getTime();
    const newDue = updateSrsFields(srcTiddler, relatedTiddlers, asked.direction, answer, now, context);
    context.wikiUtils.withTiddler("$:/state/srs/lastAnswerTime").doNotInvokeSequentiallyOnSameTiddler.updateTiddler({text:now}, true);
    const next = session.acceptAnswerAndGetNext(asked.src, newDue, answer, log);
    const nextSteps = next.entry ? getNextStepsForTitle(next.entry.src, next.entry.direction, context) : undefined;
    const answerRelatedFilter = next.entry ? getAnswerRelatedFilter(next.entry, session.getSrc(), context) : undefined;
    const data = {};
    data["current-src"] = next.entry ? next.entry.src : undefined;
    data["current-direction"] = next.entry ? next.entry.direction : undefined;
    data["current-due"] = next.entry ? next.entry.due : undefined;
    data["current-type"] = next.entry ? next.entry.type : undefined;
    data["current-answer-related-filter"] = answerRelatedFilter;
    data["counter-repeat"] = next.counters.repeat;
    data["counter-overdue"] = next.counters.overdue;
    data["counter-newcomer"] = next.counters.newcomer;
    data["next-step-reset"] = nextSteps ? nextSteps.reset : undefined;
    data["next-step-hold"] = nextSteps ? nextSteps.hold : undefined;
    data["next-step-onward"] = nextSteps ? nextSteps.onward : undefined;
    data["estimatedEndTime"] = calculateEstimatedEndTime(next.counters);
    data["modified"] = now;
    context.wikiUtils.withTiddler(ref).doNotInvokeSequentiallyOnSameTiddler.setOrCreateTiddlerData(data);
  };

  // all spaced repetition calcualtion logic is here
  // if currentStep is undefined, it should return default steps
  function calculateNextSteps(currentDueDate, currentLastDate, context) {
    const currentStep = currentDueDate && currentLastDate ? currentDueDate - currentLastDate : undefined;
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

  function getSrsFieldsValues(tiddler, srsFieldsNames) {
    if (!tiddler || !srsFieldsNames) return undefined;
    const due = utils.parseInteger(tiddler.getTiddlerField(srsFieldsNames.dueField));
    const last = utils.parseInteger(tiddler.getTiddlerField(srsFieldsNames.lastField));
    return { due, last };
  }

  function getNextStepsForTitle(title, direction, context) {
    const tiddler = context.wikiUtils.withTiddler(title);
    if (!tiddler) return undefined;
    const srsFieldsNames = getSrsFieldsNames(direction, context);
    const { due, last } = getSrsFieldsValues(tiddler, srsFieldsNames);
    return calculateNextSteps(due, last, context);
  }

  function updateSrsFields(tiddler, relatedTiddlers, direction, answer, time, context) {
    const srsFieldsNames = getSrsFieldsNames(direction, context);
    const newDue = calculateDueDate(tiddler, answer, srsFieldsNames, time, context);
    storeSrsFields(tiddler, srsFieldsNames, newDue, time, answer === utils.SRS_ANSWER_EXCLUDE, context);
    if (answer !== utils.SRS_ANSWER_RESET && answer !== utils.SRS_ANSWER_EXCLUDE && relatedTiddlers) relatedTiddlers.forEach(relatedTiddler => {
      const newDue = calculateDueDate(relatedTiddler, answer, srsFieldsNames, time, context);
      storeSrsFields(relatedTiddler, srsFieldsNames, newDue, time, false, context);
    });
    return newDue;
  }

  function calculateDueDate(tiddler, answer, srsFieldsNames, now, context) {
    const { due, last } = getSrsFieldsValues(tiddler, srsFieldsNames);
    return due > now ? now + (due - last) : decreaseDueDate(answer, calculateNextSteps(due, last, context), now);
  }

  function storeSrsFields(tiddler, srsFieldsNames, newDue, newLast, removeTag) {
    const fields = {};
    fields[srsFieldsNames.dueField] = newDue;
    fields[srsFieldsNames.lastField] = newLast;
    if (removeTag) {
      fields.tags = utils.purgeArray(tiddler.getTiddlerTagsShallowCopy(), [srsFieldsNames.tag]);
    }
    tiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler(fields);
  }

  function decreaseDueDate(answer, steps, now) {
    return new Date(answer === utils.SRS_ANSWER_HOLD ? now + randomlyDecreaseValue(steps.hold, steps.reset)
      : answer === utils.SRS_ANSWER_ONWARD ? now + randomlyDecreaseValue(steps.onward, steps.reset)
        : now + steps.reset).getTime();
  }

  function getAnswerRelatedFilter(sessionEntry, sessionSrc, context) {
    const answerCardsTag = sessionEntry.direction === utils.FORWARD_DIRECTION ? context.tags.forwardAnswerCard : context.tags.backwardAnswerCard;
    const answerCards = context.wikiUtils.filterTiddlers("[all[shadows+tiddlers]tag[" + answerCardsTag + "]field:srs-current-type[" + (sessionEntry.type || sessionSrc) + "]last[]]")
    const answerCardTiddler = answerCards && answerCards.length ? context.wikiUtils.withTiddler(answerCards[0]) : undefined;
    return answerCardTiddler ? answerCardTiddler.getTiddlerField("srs-answer-related-filter") : undefined;
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
