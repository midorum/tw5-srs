/*\
title: test/service/commitAnswer.js
module-type: library

Unit tests for the commitAnswer service.

\*/

const utils = require("test/utils");
const messageHandler = require("$:/plugins/midorum/srs/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;
const offset_24h = 1000 * 60 * 60 * 24;
const offset_1y = offset_24h * 365;

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
        const params = {
            ref: ref,
            answer: answer,
            updateRelated: undefined,
            log: log,
            idle: idle
        };
        expect(messageHandler.commitAnswer(params, options.widget, options.env)).nothing();
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
        const params = {
            ref: ref,
            answer: answer,
            updateRelated: undefined,
            log: log,
            idle: idle
        };
        expect(messageHandler.commitAnswer(params, options.widget, options.env)).nothing();
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
        const params = {
            ref: ref,
            answer: answer,
            updateRelated: undefined,
            log: log,
            idle: idle
        };
        expect(messageHandler.commitAnswer(params, options.widget, options.env)).nothing();
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
        const params = {
            ref: ref,
            answer: answer,
            updateRelated: undefined,
            log: log,
            idle: idle
        };
        expect(messageHandler.commitAnswer(params, options.widget, options.env)).nothing();
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
            expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
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
            expect(messageHandler.createSession(createSessionParams, options.widget, options.env)).nothing();
            const firstAsked = verifySession(ref, srcTag, direction, undefined, 0, 1, 0, options);
            // console.warn("firstAsked",firstAsked)
            expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
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
            expect(messageHandler.createSession(createSessionParams, options.widget, options.env)).nothing();
            const firstAsked = verifySession(ref, srcTag, direction, undefined, 0, 1, 0, options);
            expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            verifyAskedTiddler(firstAsked, answer, templateMap, options, context);
            const nextAskedTemplate = firstAsked.src === scheduledForwardTitle ? scheduledBackwardTemplate : scheduledForwardTemplate;
            verifySession(ref, srcTag, direction, nextAskedTemplate, 0, 0, 0, options);
        })

    it("should update SRS fields in source (asked) tiddler"
        + " and also in all related tiddlers which are returned by the 'updateRelated' param"
        + " when answer is not 'reset' or 'exclude'", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const srcTag = "some tag";
            const additionalTag1 = "additionalTag1";
            const additionalTag2 = "additionalTag2";
            const direction = "forward";
            const answer = "onward";
            const preAnswerHook = "preAnswerHook";
            const log = undefined;
            const idle = false;
            const targetTiddler = "targetTiddler";
            const relatedTiddler1 = "relatedTiddler1";
            const relatedTiddler2 = "relatedTiddler2";
            const relatedTiddler3 = "relatedTiddler3";
            const relatedTiddler4 = "relatedTiddler4";
            const relatedTiddler1DueDate = new Date().getTime() + 100000;
            const relatedTiddler1LastDate = new Date().getTime() - 100000;
            const relatedTiddler2DueDate = new Date().getTime() + 200000;
            const relatedTiddler2LastDate = new Date().getTime() - 200000;
            const targetTiddlerTemplate = { title: targetTiddler, tags: [srcTag, context.tags.scheduledForward, relatedTiddler2, relatedTiddler4] };
            const relatedTiddler1Template = {
                title: relatedTiddler1,
                tags: [targetTiddler, additionalTag1],
                'srs-forward-due': relatedTiddler1DueDate,
                'srs-forward-last': relatedTiddler1LastDate
            }; // should be updated
            const relatedTiddler2Template = {
                title: relatedTiddler2,
                tags: [additionalTag2],
                'srs-forward-due': relatedTiddler2DueDate,
                'srs-forward-last': relatedTiddler2LastDate
            }; // should be updated
            const relatedTiddler3Template = { title: relatedTiddler3, tags: [targetTiddler] }; // shouldn't be updated
            const relatedTiddler4Template = { title: relatedTiddler4, tags: [] }; // shouldn't be updated
            const relatedFilter = "[tag[" + additionalTag1 + "]tag<currentTiddler>] [<currentTiddler>tags[]tag[" + additionalTag2 + "]]";
            options.env.macros[preAnswerHook] = {
                name: preAnswerHook,
                params: [],
                run: function (wiki, params) {
                    console.debug("preAnswerHook hook params", params);
                    return true;
                }
            }
            options.widget.wiki.addTiddler(targetTiddlerTemplate);
            options.widget.wiki.addTiddler(relatedTiddler1Template);
            options.widget.wiki.addTiddler(relatedTiddler2Template);
            options.widget.wiki.addTiddler(relatedTiddler3Template);
            options.widget.wiki.addTiddler(relatedTiddler4Template);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            // consoleSpy.and.callThrough();
            // consoleDebugSpy.and.callThrough();
            loggerSpy.and.callThrough();
            const createSessionParams = {
                ref: ref,
                src: srcTag,
                direction: direction,
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
                updateRelated: relatedFilter,
                preAnswerHook: preAnswerHook,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(createSessionParams, options.widget)).nothing();
            expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const targetTiddlerInstance = options.widget.wiki.getTiddler(targetTiddler);
            console.debug("targetTiddlerInstance", targetTiddlerInstance);
            const relatedTiddler1Instance = options.widget.wiki.getTiddler(relatedTiddler1);
            console.debug("relatedTiddler1Instance", relatedTiddler1Instance);
            expect(relatedTiddler1Instance.fields["srs-forward-due"]).not.toEqual(targetTiddlerInstance.fields["srs-forward-due"]);
            expect(relatedTiddler1Instance.fields["srs-forward-last"]).toEqual(targetTiddlerInstance.fields["srs-forward-last"]);
            const relatedTiddler2Instance = options.widget.wiki.getTiddler(relatedTiddler2);
            console.debug("relatedTiddler2Instance", relatedTiddler2Instance);
            expect(relatedTiddler2Instance.fields["srs-forward-due"]).not.toEqual(targetTiddlerInstance.fields["srs-forward-due"]);
            expect(relatedTiddler2Instance.fields["srs-forward-last"]).toEqual(targetTiddlerInstance.fields["srs-forward-last"]);
            const relatedTiddler3Instance = options.widget.wiki.getTiddler(relatedTiddler3);
            console.debug("relatedTiddler3Instance", relatedTiddler3Instance);
            expect(relatedTiddler3Instance.fields["srs-forward-due"]).toBeUndefined();
            expect(relatedTiddler3Instance.fields["srs-forward-last"]).toBeUndefined();
            const relatedTiddler4Instance = options.widget.wiki.getTiddler(relatedTiddler4);
            console.debug("relatedTiddler4Instance", relatedTiddler4Instance);
            expect(relatedTiddler4Instance.fields["srs-forward-due"]).toBeUndefined();
            expect(relatedTiddler4Instance.fields["srs-forward-last"]).toBeUndefined();
        })

    it("should update SRS fields in source (asked) tiddler"
        + " and should not update them in associated tiddlers which are returned by the 'updateRelated' param"
        + " when answer is 'reset'", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const srcTag = "some tag";
            const additionalTag1 = "additionalTag1";
            const additionalTag2 = "additionalTag2";
            const direction = "forward";
            const answer = "reset";
            const log = undefined;
            const idle = false;
            const targetTiddler = "targetTiddler";
            const relatedTiddler1 = "relatedTiddler1";
            const relatedTiddler2 = "relatedTiddler2";
            const relatedTiddler3 = "relatedTiddler3";
            const relatedTiddler4 = "relatedTiddler4";
            const targetTiddlerTemplate = { title: targetTiddler, tags: [srcTag, context.tags.scheduledForward, relatedTiddler2, relatedTiddler4] };
            const relatedTiddler1Template = { title: relatedTiddler1, tags: [targetTiddler, additionalTag1] }; // should not be updated
            const relatedTiddler2Template = { title: relatedTiddler2, tags: [additionalTag2] }; // should not be updated
            const relatedTiddler3Template = { title: relatedTiddler3, tags: [targetTiddler] }; // shouldn't be updated
            const relatedTiddler4Template = { title: relatedTiddler4, tags: [] }; // shouldn't be updated
            const relatedFilter = "[tag[" + additionalTag1 + "]tag<currentTiddler>] [<currentTiddler>tags[]tag[" + additionalTag2 + "]]";
            options.widget.wiki.addTiddler(targetTiddlerTemplate);
            options.widget.wiki.addTiddler(relatedTiddler1Template);
            options.widget.wiki.addTiddler(relatedTiddler2Template);
            options.widget.wiki.addTiddler(relatedTiddler3Template);
            options.widget.wiki.addTiddler(relatedTiddler4Template);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            // consoleSpy.and.callThrough();
            // consoleDebugSpy.and.callThrough();
            loggerSpy.and.callThrough();
            const createSessionParams = {
                ref: ref,
                src: srcTag,
                direction: direction,
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
                updateRelated: relatedFilter,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(createSessionParams, options.widget, options.env)).nothing();
            expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const targetTiddlerInstance = options.widget.wiki.getTiddler(targetTiddler);
            console.debug("targetTiddlerInstance", targetTiddlerInstance);
            const relatedTiddler1Instance = options.widget.wiki.getTiddler(relatedTiddler1);
            console.debug("relatedTiddler1Instance", relatedTiddler1Instance);
            expect(relatedTiddler1Instance.fields["srs-forward-due"]).toBeUndefined();
            expect(relatedTiddler1Instance.fields["srs-forward-last"]).toBeUndefined();
            const relatedTiddler2Instance = options.widget.wiki.getTiddler(relatedTiddler2);
            console.debug("relatedTiddler2Instance", relatedTiddler2Instance);
            expect(relatedTiddler2Instance.fields["srs-forward-due"]).toBeUndefined();
            expect(relatedTiddler2Instance.fields["srs-forward-last"]).toBeUndefined();
            const relatedTiddler3Instance = options.widget.wiki.getTiddler(relatedTiddler3);
            console.debug("relatedTiddler3Instance", relatedTiddler3Instance);
            expect(relatedTiddler3Instance.fields["srs-forward-due"]).toBeUndefined();
            expect(relatedTiddler3Instance.fields["srs-forward-last"]).toBeUndefined();
            const relatedTiddler4Instance = options.widget.wiki.getTiddler(relatedTiddler4);
            console.debug("relatedTiddler4Instance", relatedTiddler4Instance);
            expect(relatedTiddler4Instance.fields["srs-forward-due"]).toBeUndefined();
            expect(relatedTiddler4Instance.fields["srs-forward-last"]).toBeUndefined();
        })

    it("should update SRS fields in source (asked) tiddler"
        + " and should not update them in associated tiddlers which are returned by the 'updateRelated' param"
        + " when answer is 'exclude'", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const srcTag = "some tag";
            const additionalTag1 = "additionalTag1";
            const additionalTag2 = "additionalTag2";
            const direction = "forward";
            const answer = "exclude";
            const log = undefined;
            const idle = false;
            const targetTiddler = "targetTiddler";
            const relatedTiddler1 = "relatedTiddler1";
            const relatedTiddler2 = "relatedTiddler2";
            const relatedTiddler3 = "relatedTiddler3";
            const relatedTiddler4 = "relatedTiddler4";
            const targetTiddlerTemplate = { title: targetTiddler, tags: [srcTag, context.tags.scheduledForward, relatedTiddler2, relatedTiddler4] };
            const relatedTiddler1Template = { title: relatedTiddler1, tags: [targetTiddler, additionalTag1, context.tags.scheduledForward] }; // should not be updated
            const relatedTiddler2Template = { title: relatedTiddler2, tags: [additionalTag2] }; // should not be updated
            const relatedTiddler3Template = { title: relatedTiddler3, tags: [targetTiddler] }; // shouldn't be updated
            const relatedTiddler4Template = { title: relatedTiddler4, tags: [] }; // shouldn't be updated
            const relatedFilter = "[tag[" + additionalTag1 + "]tag<currentTiddler>] [<currentTiddler>tags[]tag[" + additionalTag2 + "]]";
            options.widget.wiki.addTiddler(targetTiddlerTemplate);
            options.widget.wiki.addTiddler(relatedTiddler1Template);
            options.widget.wiki.addTiddler(relatedTiddler2Template);
            options.widget.wiki.addTiddler(relatedTiddler3Template);
            options.widget.wiki.addTiddler(relatedTiddler4Template);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            // consoleSpy.and.callThrough();
            // consoleDebugSpy.and.callThrough();
            loggerSpy.and.callThrough();
            const createSessionParams = {
                ref: ref,
                src: srcTag,
                direction: direction,
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
                updateRelated: relatedFilter,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(createSessionParams, options.widget)).nothing();
            expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const targetTiddlerInstance = options.widget.wiki.getTiddler(targetTiddler);
            console.debug("targetTiddlerInstance", targetTiddlerInstance);
            expect(targetTiddlerInstance.fields.tags.includes(context.tags.scheduledForward)).toBeFalsy();
            const relatedTiddler1Instance = options.widget.wiki.getTiddler(relatedTiddler1);
            console.debug("relatedTiddler1Instance", relatedTiddler1Instance);
            expect(relatedTiddler1Instance.fields["srs-forward-due"]).toBeUndefined();
            expect(relatedTiddler1Instance.fields["srs-forward-last"]).toBeUndefined();
            expect(relatedTiddler1Instance.fields.tags.includes(context.tags.scheduledForward)).toBeTruthy();
            const relatedTiddler2Instance = options.widget.wiki.getTiddler(relatedTiddler2);
            console.debug("relatedTiddler2Instance", relatedTiddler2Instance);
            expect(relatedTiddler2Instance.fields["srs-forward-due"]).toBeUndefined();
            expect(relatedTiddler2Instance.fields["srs-forward-last"]).toBeUndefined();
            const relatedTiddler3Instance = options.widget.wiki.getTiddler(relatedTiddler3);
            console.debug("relatedTiddler3Instance", relatedTiddler3Instance);
            expect(relatedTiddler3Instance.fields["srs-forward-due"]).toBeUndefined();
            expect(relatedTiddler3Instance.fields["srs-forward-last"]).toBeUndefined();
            const relatedTiddler4Instance = options.widget.wiki.getTiddler(relatedTiddler4);
            console.debug("relatedTiddler4Instance", relatedTiddler4Instance);
            expect(relatedTiddler4Instance.fields["srs-forward-due"]).toBeUndefined();
            expect(relatedTiddler4Instance.fields["srs-forward-last"]).toBeUndefined();
        })

    it("should update SRS fields in source (asked) tiddler"
        + " but shouldn't increase the tiddler current step if answer time is before due date", () => {
            // console.warn(">>>");
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const listProvider = "listProvider";
            const src = "src";
            const limit = undefined;
            const relatedFilter = "[tag<currentTiddler>]";
            const log = true;
            const idle = false;
            const now = new Date().getTime();
            const targetDueDate = now - offset_24h;
            const targetLastDate = targetDueDate - offset_24h;
            const targetTemplate = {
                title: "target",
                tags: [src, context.tags.scheduledForward],
                'srs-forward-due': targetDueDate,
                'srs-forward-last': targetLastDate
            };
            const relatedDueDate = now + offset_1y;
            const relatedLastDate = now - offset_24h;
            const relatedTemplate = {
                title: "related",
                tags: [targetTemplate.title],
                'srs-forward-due': relatedDueDate,
                'srs-forward-last': relatedLastDate
            };
            options.env.macros[listProvider] = {
                name: listProvider,
                params: [],
                run: function (wiki, direction, limit, time) {
                    return [
                        {
                            type: src,
                            src: targetTemplate.title,
                            direction: "forward"
                        }
                    ];
                }
            }
            options.widget.wiki.addTiddler(targetTemplate);
            options.widget.wiki.addTiddler(relatedTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            // consoleSpy.and.callThrough();
            // consoleDebugSpy.and.callThrough();
            loggerSpy.and.callThrough();
            const createSessionParams = {
                ref: ref,
                src: undefined,
                direction: undefined,
                limit: limit,
                groupFilter: undefined,
                groupStrategy: undefined,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                listProvider: listProvider,
                log: log,
                idle: idle
            };
            const commitAnswerParams = {
                ref: ref,
                answer: "onward",
                updateRelated: relatedFilter,
                log: log,
                idle: idle
            };
            // create a session
            expect(messageHandler.createSession(createSessionParams, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            if (alert = Logger.alert.calls.first()) console.warn(alert.args)
            console.debug("now", new Date(now))
            var targetTiddlerInstance = options.widget.wiki.getTiddler(targetTemplate.title);
            console.debug("targetTiddlerInstance", targetTiddlerInstance,
                "due:", new Date(targetTiddlerInstance.fields['srs-forward-due']),
                "last:", new Date(targetTiddlerInstance.fields['srs-forward-last']));
            var relatedTiddlerInstance = options.widget.wiki.getTiddler(relatedTemplate.title);
            console.debug("relatedTiddlerInstance", relatedTiddlerInstance,
                "due:", new Date(relatedTiddlerInstance.fields['srs-forward-due']),
                "last:", new Date(relatedTiddlerInstance.fields['srs-forward-last']));
            const dueValue = relatedTiddlerInstance.fields['srs-forward-due'];
            const lastValue = relatedTiddlerInstance.fields['srs-forward-last'];
            const stepSize = dueValue - lastValue;
            console.debug("--- commit answer ---")
            expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
            targetTiddlerInstance = options.widget.wiki.getTiddler(targetTemplate.title);
            console.debug("targetTiddlerInstance", targetTiddlerInstance,
                "due:", new Date(targetTiddlerInstance.fields['srs-forward-due']),
                "last:", new Date(targetTiddlerInstance.fields['srs-forward-last']));
            relatedTiddlerInstance = options.widget.wiki.getTiddler(relatedTemplate.title);
            console.debug("relatedTiddlerInstance", relatedTiddlerInstance,
                "due:", new Date(relatedTiddlerInstance.fields['srs-forward-due']),
                "last:", new Date(relatedTiddlerInstance.fields['srs-forward-last']));
            expect(relatedTiddlerInstance.fields['srs-forward-due']).toBeGreaterThan(dueValue);
            expect(relatedTiddlerInstance.fields['srs-forward-last']).toBeGreaterThan(lastValue);
            expect(relatedTiddlerInstance.fields['srs-forward-due'] - relatedTiddlerInstance.fields['srs-forward-last']).toEqual(stepSize);
        })

    it("should update SRS fields in source (asked) tiddler"
        + " and invoke answer hooks when they are defined"
        + " when preAnswerHook returns true", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const srcTag = "some tag";
            const direction = "both";
            const answer = "onward";
            const preAnswerHook = "preAnswerHook";
            const postAnswerHook = "postAnswerHook";
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
            options.env.macros[preAnswerHook] = {
                name: preAnswerHook,
                params: [],
                run: function (wiki, params) {
                    console.debug("preAnswerHook hook params", params);
                    expect(wiki).toBeDefined();
                    expect(params).toBeDefined();
                    const ft = wiki.getTiddler(scheduledForwardTitle);
                    expect(ft.fields['srs-forward-due']).toEqual(scheduledForwardTemplate['srs-forward-due']);
                    expect(ft.fields['srs-forward-last']).toEqual(scheduledForwardTemplate['srs-forward-last']);
                    const bt = wiki.getTiddler(scheduledBacwardTitle);
                    expect(bt.fields['srs-forward-due']).toEqual(scheduledBackwardTemplate['srs-forward-due']);
                    expect(bt.fields['srs-forward-last']).toEqual(scheduledBackwardTemplate['srs-forward-last']);
                    return true;
                }
            }
            options.env.macros[postAnswerHook] = {
                name: postAnswerHook,
                params: [],
                run: function (wiki, params) {
                    console.debug("postAnswerHook hook params", params);
                    expect(wiki).toBeDefined();
                    expect(params).toBeDefined();
                    const ft = wiki.getTiddler(scheduledForwardTitle);
                    expect(ft.fields['srs-forward-due']).not.toEqual(scheduledForwardTemplate['srs-forward-due']);
                    expect(ft.fields['srs-forward-last']).not.toEqual(scheduledForwardTemplate['srs-forward-last']);
                    const bt = wiki.getTiddler(scheduledBacwardTitle);
                    expect(bt.fields['srs-forward-due']).toEqual(scheduledBackwardTemplate['srs-forward-due']);
                    expect(bt.fields['srs-forward-last']).toEqual(scheduledBackwardTemplate['srs-forward-last']);
                }
            }
            options.widget.wiki.addTiddler(scheduledForwardTemplate);
            options.widget.wiki.addTiddler(scheduledBackwardTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            // consoleSpy.and.callThrough();
            // consoleDebugSpy.and.callThrough();
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
                preAnswerHook: preAnswerHook,
                postAnswerHook: postAnswerHook,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(createSessionParams, options.widget, options.env)).nothing();
            const firstAsked = verifySession(ref, srcTag, direction, undefined, 0, 1, 0, options);
            // console.warn("firstAsked",firstAsked)
            expect(messageHandler.commitAnswer(commitAnswerParams, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            verifyAskedTiddler(firstAsked, answer, templateMap, options, context);
            const nextAskedTemplate = firstAsked.src === scheduledForwardTitle ? scheduledBackwardTemplate : scheduledForwardTemplate;
            // console.warn("nextAskedTemplate",nextAskedTemplate)
            verifySession(ref, srcTag, direction, nextAskedTemplate, 1, 0, 0, options);
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
