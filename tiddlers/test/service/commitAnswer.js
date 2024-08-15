/*\
title: test/service/commitAnswer.js
module-type: library

Unit tests for the commitAnswer service.

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

    it("should be defined", () => {
        expect(messageHandler.commitAnswer).toBeDefined();
    })

    it("should fail when ref argument is not defined", () => {
        const options = utils.setupWiki();
        const ref = undefined;
        const answer = undefined;
        const log = undefined;
        const idle = true;
        const expectedMessage = "ref cannot be empty";
        expect(messageHandler.commitAnswer(ref, answer, log, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when answer argument is not defined", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const answer = undefined;
        const log = undefined;
        const idle = true;
        const expectedMessage = "answer cannot be empty";
        expect(messageHandler.commitAnswer(ref, answer, log, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when answer argument is wrong", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const answer = "some";
        const log = undefined;
        const idle = true;
        const expectedMessage = "answer argument should be one of [reset,hold,onward,exclude]";
        expect(messageHandler.commitAnswer(ref, answer, log, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when session tiddler is not found", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const answer = "reset";
        const log = undefined;
        const idle = false;
        const expectedMessage = "SRS session not found: " + ref;
        expect(messageHandler.commitAnswer(ref, answer, log, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should update SRS fields in source (asked) tiddler"
        + " and move source tiddler to 'repeat' group"
        + " and set next current tiddler"
        + " when answer is 'reset'", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const srcTag = "some tag";
            const direction = "both";
            const answer = "reset";
            const log = undefined;
            const idle = false;
            const scheduledForwardTitle = "scheduledForward";
            const scheduledBacwardTitle = "scheduledBackward";
            const scheduledForwardTemplate = { title: scheduledForwardTitle, tags: [srcTag, context.tags.scheduledForward] };
            const scheduledBackwardTemplate = { title: scheduledBacwardTitle, tags: [srcTag, context.tags.scheduledBackward] };
            const templateMap = {};
            templateMap[scheduledForwardTemplate.title] = scheduledForwardTemplate;
            templateMap[scheduledBackwardTemplate.title] = scheduledBackwardTemplate;
            options.widget.wiki.addTiddler(scheduledForwardTemplate);
            options.widget.wiki.addTiddler(scheduledBackwardTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            loggerSpy.and.callThrough();
            const params = {
                ref: ref,
                src: srcTag,
                direction: "both",
                limit: undefined,
                groupFilter: undefined,
                groupStrategy: undefined,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(params, options.widget)).nothing();
            const firstAsked = verifySession(ref, srcTag, direction, undefined, 0, 1, 0, options);
            expect(messageHandler.commitAnswer(ref, answer, log, idle, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            verifyAskedTiddler(firstAsked, answer, templateMap, options, context);
            const nextAskedTemplate = firstAsked.src === scheduledForwardTitle ? scheduledBackwardTemplate : scheduledForwardTemplate;
            verifySession(ref, srcTag, direction, nextAskedTemplate, 1, 0, 0, options);
        })

    it("should update SRS fields in source (asked) tiddler"
        + " and move source tiddler to 'onward' group"
        + " and set next current tiddler"
        + " when answer is 'onward'", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const srcTag = "some tag";
            const direction = "both";
            const answer = "onward";
            const log = undefined;
            const idle = false;
            const scheduledForwardTitle = "scheduledForward";
            const scheduledBacwardTitle = "scheduledBackward";
            const scheduledForwardTemplate = {
                title: scheduledForwardTitle,
                tags: [srcTag, context.tags.scheduledForward],
                'srs-forward-due': 1716874123993,
                'srs-forward-last': 1716874063993
            };
            const scheduledBackwardTemplate = {
                title: scheduledBacwardTitle,
                tags: [srcTag, context.tags.scheduledBackward]
            };
            const templateMap = {};
            templateMap[scheduledForwardTemplate.title] = scheduledForwardTemplate;
            templateMap[scheduledBackwardTemplate.title] = scheduledBackwardTemplate;
            options.widget.wiki.addTiddler(scheduledForwardTemplate);
            options.widget.wiki.addTiddler(scheduledBackwardTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            loggerSpy.and.callThrough();
            const params = {
                ref: ref,
                src: srcTag,
                direction: "both",
                limit: undefined,
                groupFilter: undefined,
                groupStrategy: undefined,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(params, options.widget)).nothing();
            const firstAsked = verifySession(ref, srcTag, direction, undefined, 0, 1, 0, options);
            // console.warn("firstAsked",firstAsked)
            expect(messageHandler.commitAnswer(ref, answer, log, idle, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            verifyAskedTiddler(firstAsked, answer, templateMap, options, context);
            const nextAskedTemplate = firstAsked.src === scheduledForwardTitle ? scheduledBackwardTemplate : scheduledForwardTemplate;
            // console.warn("nextAskedTemplate",nextAskedTemplate)
            verifySession(ref, srcTag, direction, nextAskedTemplate, 1, 0, 0, options);
        })

    it("should update SRS fields in source (asked) tiddler"
        + " and remove asked tiddler from session"
        + " and remove scheduled tag from asked tiddler"
        + " and set next current tiddler"
        + " when answer is 'exclude'", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const srcTag = "some tag";
            const direction = "both";
            const answer = "exclude";
            const log = undefined;
            const idle = false;
            const scheduledForwardTitle = "scheduledForward";
            const scheduledBacwardTitle = "scheduledBackward";
            const scheduledForwardTemplate = { title: scheduledForwardTitle, tags: [srcTag, context.tags.scheduledForward] };
            const scheduledBackwardTemplate = { title: scheduledBacwardTitle, tags: [srcTag, context.tags.scheduledBackward] };
            const templateMap = {};
            templateMap[scheduledForwardTemplate.title] = scheduledForwardTemplate;
            templateMap[scheduledBackwardTemplate.title] = scheduledBackwardTemplate;
            options.widget.wiki.addTiddler(scheduledForwardTemplate);
            options.widget.wiki.addTiddler(scheduledBackwardTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            // consoleSpy.and.callThrough();
            // consoleDebugSpy.and.callThrough();
            loggerSpy.and.callThrough();
            const params = {
                ref: ref,
                src: srcTag,
                direction: "both",
                limit: undefined,
                groupFilter: undefined,
                groupStrategy: undefined,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(params, options.widget)).nothing();
            const firstAsked = verifySession(ref, srcTag, direction, undefined, 0, 1, 0, options);
            expect(messageHandler.commitAnswer(ref, answer, log, idle, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            verifyAskedTiddler(firstAsked, answer, templateMap, options, context);
            const nextAskedTemplate = firstAsked.src === scheduledForwardTitle ? scheduledBackwardTemplate : scheduledForwardTemplate;
            verifySession(ref, srcTag, direction, nextAskedTemplate, 0, 0, 0, options);
        })

});

function verifyAskedTiddler(asked, answer, templateMap, options, context) {
    const askedTiddlerInstance = options.widget.wiki.getTiddler(asked.src);
    console.debug("askedTiddlerInstance", askedTiddlerInstance);
    const originalTemplate = templateMap[asked.src];
    // console.debug("originalTemplate", originalTemplate);
    if (asked.direction === "forward") {
        expect(askedTiddlerInstance.fields["srs-forward-due"]).toBeDefined();
        expect(askedTiddlerInstance.fields["srs-forward-last"]).toBeDefined();
        if (originalTemplate["srs-forward-due"]) {
            expect(askedTiddlerInstance.fields["srs-forward-due"]).toBeGreaterThan(originalTemplate["srs-forward-due"]);
        }
        if (originalTemplate["srs-forward-last"]) {
            expect(askedTiddlerInstance.fields["srs-forward-last"]).toBeGreaterThan(originalTemplate["srs-forward-last"]);
        }
    } else {
        expect(askedTiddlerInstance.fields["srs-backward-due"]).toBeDefined();
        expect(askedTiddlerInstance.fields["srs-backward-last"]).toBeDefined();
        if (originalTemplate["srs-backward-due"]) {
            expect(askedTiddlerInstance.fields["srs-backward-due"]).toBeGreaterThan(originalTemplate["srs-backward-due"]);
        }
        if (originalTemplate["srs-backward-last"]) {
            expect(askedTiddlerInstance.fields["srs-backward-last"]).toBeGreaterThan(originalTemplate["srs-backward-last"]);
        }
    }
    if (answer === "exclude") {
        if (asked.direction === "forward") {
            expect(askedTiddlerInstance.fields.tags.includes(context.tags.scheduledForward)).toBeFalsy();
        } else {
            expect(askedTiddlerInstance.fields.tags.includes(context.tags.scheduledBackward)).toBeFalsy();
        }
    } else {
        if (asked.direction === "forward") {
            expect(askedTiddlerInstance.fields.tags.includes(context.tags.scheduledForward)).toBeTruthy();
        } else {
            expect(askedTiddlerInstance.fields.tags.includes(context.tags.scheduledBackward)).toBeTruthy();
        }
    }
}

function verifySession(session, srcTag, direction, current, repeatCount, newcomerCount, overdueCount, options) {
    const sessionInstance = options.widget.wiki.getTiddler(session);
    console.debug("sessionInstance", sessionInstance);
    expect(sessionInstance).toBeDefined();
    const sessionData = JSON.parse(sessionInstance.fields.text);
    expect(sessionData).toBeDefined();
    expect(sessionData.src).toEqual(srcTag);
    expect(sessionData.direction).toEqual(direction);
    expect(sessionData["counter-repeat"]).toEqual(repeatCount);
    expect(sessionData["counter-overdue"]).toEqual(overdueCount);
    expect(sessionData["counter-newcomer"]).toEqual(newcomerCount);
    const currentSrc = sessionData["current-src"];
    if (current) {
        expect(currentSrc).toEqual(current.title);
    }
    return {
        src: currentSrc,
        direction: sessionData["current-direction"]
    };
}
