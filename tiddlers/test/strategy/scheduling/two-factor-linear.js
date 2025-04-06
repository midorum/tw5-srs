/*\
title: test/strategy/two-factor-linear.js
module-type: library

Unit tests for the two-factor-linear strategy.

\*/

const utils = require("test/utils");
const messageHandler = require("$:/plugins/midorum/srs/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;


describe("The two-factor-linear strategy", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should increase the current step by a short factor when it is less than the pivot value"
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
            const lastTime = 1716874063993;
            const currentStep = 60000;
            const expectedNextTimeMin = currentStep * 10.0 * 0.9 + 1; // default factors
            const expectedNextTimeMax = currentStep * 10.0 + 1; // default factors
            const scheduledForwardTemplate = {
                title: scheduledForwardTitle,
                tags: [srcTag, context.tags.scheduledForward],
                'srs-forward-due': lastTime + currentStep,
                'srs-forward-last': lastTime
            };
            // console.warn(scheduledForwardTemplate['srs-forward-last'] - scheduledForwardTemplate['srs-forward-due'])
            const scheduledBackwardTemplate = {
                title: scheduledBacwardTitle,
                tags: [srcTag, context.tags.scheduledBackward]
            };
            const templateMap = {};
            templateMap[scheduledForwardTemplate.title] = scheduledForwardTemplate;
            templateMap[scheduledBackwardTemplate.title] = scheduledBackwardTemplate;
            options.widget.wiki.addTiddler(scheduledForwardTemplate);
            options.widget.wiki.addTiddler(scheduledBackwardTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "two-factor-linear" });
            loggerSpy.and.callThrough();
            const createSessionParams = {
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
            const commitAnswerParams = {
                ref: ref,
                answer: answer,
                updateRelated: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(createSessionParams, options.widget)).nothing();
            const firstAsked = verifySession(ref, srcTag, direction, undefined, 0, 1, 0, options);
            // console.warn("firstAsked", firstAsked)
            expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            verifyAskedTiddler(firstAsked, templateMap, expectedNextTimeMin, expectedNextTimeMax, options);
        })

    it("should increase the current step by a short factor and decrease by a long factor ration when it is equals or greater than the pivot value"
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
            const lastTime = 1716874063993;
            const currentStep = 1000 * 60 * 60 * 24; // default pivot value
            const expectedNextTimeMin = currentStep * 10.0 / 2.0 * 0.9 + 1; // default factors
            const expectedNextTimeMax = currentStep * 10.0 / 2.0 + 1; // default factors
            const scheduledForwardTemplate = {
                title: scheduledForwardTitle,
                tags: [srcTag, context.tags.scheduledForward],
                'srs-forward-due': lastTime + currentStep,
                'srs-forward-last': lastTime
            };
            // console.warn(scheduledForwardTemplate['srs-forward-last'] - scheduledForwardTemplate['srs-forward-due'])
            const scheduledBackwardTemplate = {
                title: scheduledBacwardTitle,
                tags: [srcTag, context.tags.scheduledBackward]
            };
            const templateMap = {};
            templateMap[scheduledForwardTemplate.title] = scheduledForwardTemplate;
            templateMap[scheduledBackwardTemplate.title] = scheduledBackwardTemplate;
            options.widget.wiki.addTiddler(scheduledForwardTemplate);
            options.widget.wiki.addTiddler(scheduledBackwardTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "two-factor-linear" });
            loggerSpy.and.callThrough();
            const createSessionParams = {
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
            const commitAnswerParams = {
                ref: ref,
                answer: answer,
                updateRelated: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(createSessionParams, options.widget)).nothing();
            const firstAsked = verifySession(ref, srcTag, direction, undefined, 0, 1, 0, options);
            // console.warn("firstAsked", firstAsked)
            expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            verifyAskedTiddler(firstAsked, templateMap, expectedNextTimeMin, expectedNextTimeMax, options);
        })

});

function verifyAskedTiddler(asked, templateMap, expectedNextTimeMin, expectedNextTimeMax, options) {
    const askedTiddlerInstance = options.widget.wiki.getTiddler(asked.src);
    // console.warn("askedTiddlerInstance", askedTiddlerInstance);
    const originalTemplate = templateMap[asked.src];
    // console.warn("originalTemplate", originalTemplate);
    if (asked.direction === "forward") {
        expect(askedTiddlerInstance.fields["srs-forward-due"]).toBeDefined();
        expect(askedTiddlerInstance.fields["srs-forward-last"]).toBeDefined();
        expect(askedTiddlerInstance.fields["srs-forward-due"]).toBeGreaterThan(originalTemplate["srs-forward-due"]);
        expect(askedTiddlerInstance.fields["srs-forward-last"]).toBeGreaterThan(originalTemplate["srs-forward-last"]);
        const step = askedTiddlerInstance.fields["srs-forward-due"] - askedTiddlerInstance.fields["srs-forward-last"];
        expect(step).toBeGreaterThan(expectedNextTimeMin);
        expect(step).toBeLessThan(expectedNextTimeMax);
    } else {
        expect(askedTiddlerInstance.fields["srs-backward-due"]).toBeDefined();
        expect(askedTiddlerInstance.fields["srs-backward-last"]).toBeDefined();
        expect(askedTiddlerInstance.fields["srs-backward-due"]).toBeGreaterThan(originalTemplate["srs-backward-due"]);
        expect(askedTiddlerInstance.fields["srs-backward-last"]).toBeGreaterThan(originalTemplate["srs-backward-last"]);
        const step = askedTiddlerInstance.fields["srs-backward-due"] - askedTiddlerInstance.fields["srs-backward-last"];
        expect(step).toBeGreaterThan(expectedNextTimeMin);
        expect(step).toBeLessThan(expectedNextTimeMax);
    }
}

function verifySession(session, srcTag, direction, current, repeatCount, newcomerCount, overdueCount, options) {
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
    const currentSrc = sessionData["current-src"];
    if (current) {
        expect(currentSrc).toEqual(current.title);
    }
    return {
        src: currentSrc,
        direction: sessionData["current-direction"]
    };
}
