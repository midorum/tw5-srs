/*\
title: test/strategy/scheduling/resetAfterEmpty.js
module-type: library

Unit tests for the commitAnswer service when the resetAfterEmpty option is set

\*/

const utils = require("test/utils");
const messageHandler = require("$:/plugins/midorum/srs/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The commitAnswer service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should not recreate the session"
        + " when next item is empty"
        + " and resetAfter is not set", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const src = "some tag";
            const direction = "forward";
            const group1 = "group1";
            const group2 = "group2";
            const skippedGroup = "group3";
            const groupStrategy = "nFromGroup";
            const groupListFilter = "[[" + group1 + "]][[" + group2 + "]]"; // two groups
            const groupFilter = "[<currentTiddler>tag<groupTitle>]"; // take item if it has apropriate group tag
            const groupLimit = 2; // two items from each group
            const log = true;
            const idle = false;
            const sourceTiddlers = createSourceTiddlers(src, [group1, group2, skippedGroup], options, context);
            // console.warn(sourceTiddlers);
            // console.warn(options.widget.wiki.getTiddler("group1item1"))
            const askedMap = {};
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            // consoleSpy.and.callThrough();
            loggerSpy.and.callThrough();
            const createSessionParams = {
                ref: ref,
                src: src,
                direction: direction,
                limit: undefined,
                groupFilter: groupFilter,
                groupStrategy: groupStrategy,
                groupListFilter: groupListFilter,
                groupLimit: groupLimit,
                resetAfter: undefined,
                log: log,
                idle: idle
            };
            const commitAnswerParams = {
                ref: ref,
                answer: "onward",
                updateRelated: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(createSessionParams, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const expectedTiddlersCount = 4;
            var actualTiddlersCount = 0;
            var asked;
            asked = verifySession(ref, src, direction, options);
            do {
                // console.warn("asked", asked)
                if (asked.src) {
                    actualTiddlersCount++;
                }
                expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
                asked = verifySession(ref, src, direction, options);
            } while (asked.src)
            expect(expectedTiddlersCount).toEqual(actualTiddlersCount);
        })

    it("should recreate the session"
        + " when next item is empty"
        + " and resetAfter is -1", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const src = "some tag";
            const direction = "forward";
            const group1 = "group1";
            const group2 = "group2";
            const skippedGroup = "group3";
            const groupStrategy = "nFromGroup";
            const groupListFilter = "[[" + group1 + "]][[" + group2 + "]]"; // two groups
            const groupFilter = "[<currentTiddler>tag<groupTitle>]"; // take item if it has apropriate group tag
            const groupLimit = 2; // two items from each group
            const log = true;
            const idle = false;
            const sourceTiddlers = createSourceTiddlers(src, [group1, group2, skippedGroup], options, context);
            // console.warn(sourceTiddlers);
            // console.warn(options.widget.wiki.getTiddler("group1item1"))
            const askedMap = {};
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            // consoleSpy.and.callThrough();
            loggerSpy.and.callThrough();
            const createSessionParams = {
                ref: ref,
                src: src,
                direction: direction,
                limit: undefined,
                groupFilter: groupFilter,
                groupStrategy: groupStrategy,
                groupListFilter: groupListFilter,
                groupLimit: groupLimit,
                resetAfter: -1,
                log: log,
                idle: idle
            };
            const commitAnswerParams = {
                ref: ref,
                answer: "onward",
                updateRelated: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(createSessionParams, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const expectedTiddlersCount = 10;
            var actualTiddlersCount = 0;
            var asked;
            asked = verifySession(ref, src, direction, options);
            do {
                // console.warn("asked", asked)
                if (asked.src) {
                    actualTiddlersCount++;
                }
                expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
                asked = verifySession(ref, src, direction, options);
            } while (asked.src)
            expect(expectedTiddlersCount).toEqual(actualTiddlersCount);
        })

});

function verifySession(session, srcTag, direction, options) {
    const sessionInstance = options.widget.wiki.getTiddler(session);
    // console.warn("sessionInstance", sessionInstance);
    expect(sessionInstance).toBeDefined();
    const sessionData = JSON.parse(sessionInstance.fields.text);
    expect(sessionData).toBeDefined();
    expect(sessionData.src).toEqual(srcTag);
    expect(sessionData.direction).toEqual(direction);
    return {
        src: sessionData["current-src"],
        direction: sessionData["current-direction"]
    };
}

function createSourceTiddlers(src, groups, options, context) {
    const itemCount = 5;
    const futureDate = new Date().getTime() + 1000 * 60 * 60 * 24;
    const groupMap = {};
    groups.forEach(group => {
        options.widget.wiki.addTiddler({ title: group });
        groupMap[group] = [];
        for (let i = 1; i <= itemCount; i++) {
            const itemTitle = group + "item" + i;
            options.widget.wiki.addTiddler({
                title: itemTitle,
                tags: [src, group, context.tags.scheduledForward, context.tags.scheduledBackward]
            });
            groupMap[group].push(itemTitle);
        }
    });
    return {
        groups: groupMap
    }
}
