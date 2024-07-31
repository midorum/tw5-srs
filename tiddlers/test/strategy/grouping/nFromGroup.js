/*\
title: test/strategy/grouping/nFromGroup.js
module-type: library

Unit tests for the createSession service with a nFromGroup strategy

\*/

const utils = require("test/utils");
const messageHandler = require("$:/plugins/midorum/srs/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The createSession service", () => {
    var consoleSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        loggerSpy = spyOn(Logger, 'alert');
    });

    describe("with nFromGroup group strategy", () => {

        it("should create a new session"
            + " and schedule four tiddlers to learn (two groups; two items from each group)"
            + " and set current tiddler"
            + " when direction is both", () => {
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const src = "some tag";
                const direction = "both";
                const limit = undefined;
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
                expect(messageHandler.createSession(ref, src, direction, limit, groupFilter, groupStrategy, groupListFilter, groupLimit, log, idle, options.widget)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(0);
                var expectedTiddlersCount = 4;
                var expectedNewComerTiddlers = 3;
                var expectedRepeatTiddlers = 0;
                while(expectedTiddlersCount-- > 0) {
                    const asked = verifySession(ref, src, direction, expectedRepeatTiddlers++, expectedNewComerTiddlers--, 0, options);
                    verifyAskedTiddler(asked, sourceTiddlers, askedMap);
                    expect(messageHandler.commitAnswer(ref, "onward", log, idle, options.widget)).nothing();
                }
                expect(askedMap[group1]).toEqual(2);
                expect(askedMap[group2]).toEqual(2);
                expect(askedMap[skippedGroup]).toBeUndefined();
            })

        it("should create a new session"
            + " and schedule ten tiddlers to learn (two groups; five items from each group)"
            + " and set current tiddler"
            + " when direction is both", () => {
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const src = "some tag";
                const direction = "both";
                const limit = undefined;
                const group1 = "group1";
                const group2 = "group2";
                const skippedGroup = "group3";
                const groupStrategy = "nFromGroup";
                const groupListFilter = "[[" + group1 + "]][[" + group2 + "]]"; // two groups
                const groupFilter = "[<currentTiddler>tag<groupTitle>]"; // take item if it has apropriate group tag
                const groupLimit = undefined; // no limit
                // const groupLimit = 0; // no limit
                const log = true;
                const idle = false;
                const sourceTiddlers = createSourceTiddlers(src, [group1, group2, skippedGroup], options, context);
                // console.warn(sourceTiddlers);
                // console.warn(options.widget.wiki.getTiddler("group1item1"))
                const askedMap = {};
                options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
                // consoleSpy.and.callThrough();
                loggerSpy.and.callThrough();
                expect(messageHandler.createSession(ref, src, direction, limit, groupFilter, groupStrategy, groupListFilter, groupLimit, log, idle, options.widget)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(0);
                var expectedTiddlersCount = 10;
                var expectedNewComerTiddlers = 9;
                var expectedRepeatTiddlers = 0;
                while(expectedTiddlersCount-- > 0) {
                    const asked = verifySession(ref, src, direction, expectedRepeatTiddlers++, expectedNewComerTiddlers--, 0, options);
                    verifyAskedTiddler(asked, sourceTiddlers, askedMap);
                    expect(messageHandler.commitAnswer(ref, "onward", log, idle, options.widget)).nothing();
                }
                expect(askedMap[group1]).toEqual(5);
                expect(askedMap[group2]).toEqual(5);
                expect(askedMap[skippedGroup]).toBeUndefined();
            })

    });

});

function verifyAskedTiddler(asked, sourceTiddlers, askedMap) {
    // console.warn(asked);
    for (const group in sourceTiddlers.groups) {
        if (sourceTiddlers.groups[group].includes(asked.src)) {
            askedMap[group] = (askedMap[group] || 0) + 1;
        }
    }
    // console.warn(askedMap);
}

function verifySession(session, srcTag, direction, repeatCount, newcomerCount, overdueCount, options) {
    const sessionInstance = options.widget.wiki.getTiddler(session);
    // console.warn(sessionInstance);
    expect(sessionInstance).toBeDefined();
    const sessionData = JSON.parse(sessionInstance.fields.text);
    expect(sessionData).toBeDefined();
    expect(sessionData.src).toEqual(srcTag);
    expect(sessionData.direction).toEqual(direction);
    expect(sessionData["counter-repeat"]).toEqual(repeatCount);
    expect(sessionData["counter-overdue"]).toEqual(overdueCount);
    expect(sessionData["counter-newcomer"]).toEqual(newcomerCount);
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
