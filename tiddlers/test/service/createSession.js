/*\
title: test/service/createSession.js
module-type: library

Unit tests for the createSession service.

\*/

const utils = require("test/utils");
const messageHandler = require("$:/plugins/midorum/srs/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The createSession service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.createSession).toBeDefined();
    })

    it("should fail when the `ref` argument is not defined", () => {
        const options = utils.setupWiki();
        const ref = undefined;
        const src = undefined;
        const direction = undefined;
        const limit = undefined;
        const groupFilter = undefined;
        const groupStrategy = undefined;
        const log = undefined;
        const idle = true;
        const expectedMessage = "ref cannot be empty";
        const params = {
            ref: ref,
            src: src,
            direction: direction,
            limit: limit,
            groupFilter: groupFilter,
            groupStrategy: groupStrategy,
            groupListFilter: undefined,
            groupLimit: undefined,
            resetAfter: undefined,
            log: log,
            idle: idle
        };
        expect(messageHandler.createSession(params, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when the `src` argument is not defined", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const src = undefined;
        const direction = undefined;
        const limit = undefined;
        const groupFilter = undefined;
        const groupStrategy = undefined;
        const log = undefined;
        const idle = true;
        const expectedMessage = "src cannot be empty";
        const params = {
            ref: ref,
            src: src,
            direction: direction,
            limit: limit,
            groupFilter: groupFilter,
            groupStrategy: groupStrategy,
            groupListFilter: undefined,
            groupLimit: undefined,
            resetAfter: undefined,
            log: log,
            idle: idle
        };
        expect(messageHandler.createSession(params, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when the `direction` argument is wrong", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const src = "some";
        const direction = "wrong";
        const limit = undefined;
        const groupFilter = undefined;
        const groupStrategy = undefined;
        const log = undefined;
        const idle = true;
        const expectedMessage = "direction should be one of [forward,backward,both]";
        const params = {
            ref: ref,
            src: src,
            direction: direction,
            limit: limit,
            groupFilter: groupFilter,
            groupStrategy: groupStrategy,
            groupListFilter: undefined,
            groupLimit: undefined,
            resetAfter: undefined,
            log: log,
            idle: idle
        };
        expect(messageHandler.createSession(params, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should create a new session"
        + " and schedule one tiddler to learn"
        + " and set the current tiddler"
        + " when the direction is forward", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const src = "some tag";
            const direction = "forward";
            const limit = undefined;
            const groupFilter = undefined;
            const groupStrategy = undefined;
            const log = true;
            const idle = false;
            const scheduledForwardTemplate = { title: "scheduledForward", tags: [src, context.tags.scheduledForward] };
            const scheduledBackwardTemplate = { title: "scheduledBackward", tags: [src, context.tags.scheduledBackward] };
            options.widget.wiki.addTiddler(scheduledForwardTemplate);
            options.widget.wiki.addTiddler(scheduledBackwardTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            const params = {
                ref: ref,
                src: src,
                direction: direction,
                limit: limit,
                groupFilter: groupFilter,
                groupStrategy: groupStrategy,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(params, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const sessionInstance = options.widget.wiki.getTiddler(ref);
            // console.warn(sessionInstance);
            expect(sessionInstance).toBeDefined();
            const sessionData = JSON.parse(sessionInstance.fields.text);
            expect(sessionData).toBeDefined();
            expect(sessionData.src).toEqual(src);
            expect(sessionData.direction).toEqual(direction);
            expect(sessionData["current-src"]).toEqual(scheduledForwardTemplate.title);
            expect(sessionData["current-direction"]).toEqual(direction);
            expect(sessionData["counter-repeat"]).toEqual(0);
            expect(sessionData["counter-overdue"]).toEqual(0);
            expect(sessionData["counter-newcomer"]).toEqual(0);
        })

    it("should create a new session"
        + " and schedule one tiddler to learn"
        + " and set the current tiddler"
        + " when the direction is backward", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const src = "some tag";
            const direction = "backward";
            const limit = undefined;
            const groupFilter = undefined;
            const groupStrategy = undefined;
            const log = true;
            const idle = false;
            const scheduledForwardTemplate = { title: "scheduledForward", tags: [src, context.tags.scheduledForward] };
            const scheduledBackwardTemplate = { title: "scheduledBackward", tags: [src, context.tags.scheduledBackward] };
            options.widget.wiki.addTiddler(scheduledForwardTemplate);
            options.widget.wiki.addTiddler(scheduledBackwardTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            const params = {
                ref: ref,
                src: src,
                direction: direction,
                limit: limit,
                groupFilter: groupFilter,
                groupStrategy: groupStrategy,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(params, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const sessionInstance = options.widget.wiki.getTiddler(ref);
            // console.warn(sessionInstance);
            expect(sessionInstance).toBeDefined();
            const sessionData = JSON.parse(sessionInstance.fields.text);
            expect(sessionData).toBeDefined();
            expect(sessionData.src).toEqual(src);
            expect(sessionData.direction).toEqual(direction);
            expect(sessionData["current-src"]).toEqual(scheduledBackwardTemplate.title);
            expect(sessionData["current-direction"]).toEqual(direction);
            expect(sessionData["counter-repeat"]).toEqual(0);
            expect(sessionData["counter-overdue"]).toEqual(0);
            expect(sessionData["counter-newcomer"]).toEqual(0);
        })

    it("should create a new session"
        + " and schedule two tiddlers to learn"
        + " and set the current tiddler"
        + " when the direction is both", () => {
            // console.warn(">>>");
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const src = "some tag";
            const direction = "both";
            const limit = undefined;
            const groupFilter = undefined;
            const groupStrategy = undefined;
            const log = true;
            const idle = false;
            const scheduledForwardTemplate = { title: "scheduledForward", tags: [src, context.tags.scheduledForward] };
            const scheduledBackwardTemplate = { title: "scheduledBackward", tags: [src, context.tags.scheduledBackward] };
            options.widget.wiki.addTiddler(scheduledForwardTemplate);
            options.widget.wiki.addTiddler(scheduledBackwardTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            const params = {
                ref: ref,
                src: src,
                direction: direction,
                limit: limit,
                groupFilter: groupFilter,
                groupStrategy: groupStrategy,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(params, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const sessionInstance = options.widget.wiki.getTiddler(ref);
            // console.warn(sessionInstance);
            expect(sessionInstance).toBeDefined();
            const sessionData = JSON.parse(sessionInstance.fields.text);
            expect(sessionData).toBeDefined();
            expect(sessionData.src).toEqual(src);
            expect(sessionData.direction).toEqual(direction);
            expect(sessionData["current-src"]).toEqual(scheduledBackwardTemplate.title);
            expect(sessionData["counter-repeat"]).toEqual(0);
            expect(sessionData["counter-overdue"]).toEqual(0);
            expect(sessionData["counter-newcomer"]).toEqual(1);
        })

    it("should create a new session"
        + " and schedule an overdue tiddler to learn"
        + " when the `order` parameter is not set", () => {
            // console.warn(">>>");
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const src = "some tag";
            const direction = "both";
            const limit = undefined;
            const groupFilter = undefined;
            const groupStrategy = undefined;
            const log = true;
            const idle = false;
            const overdueTiddlerTemplate = {
                title: "overdueTiddler",
                tags: [src, context.tags.scheduledForward],
                'srs-forward-due': new Date().getTime(),
                'srs-forward-last': new Date().getTime()
            };
            const newTiddlerTemplate = { title: "newTiddler", tags: [src, context.tags.scheduledBackward] };
            options.widget.wiki.addTiddler(overdueTiddlerTemplate);
            options.widget.wiki.addTiddler(newTiddlerTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            const params = {
                ref: ref,
                src: src,
                direction: direction,
                limit: limit,
                groupFilter: groupFilter,
                groupStrategy: groupStrategy,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                order: undefined,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(params, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const sessionInstance = options.widget.wiki.getTiddler(ref);
            // console.warn(sessionInstance);
            expect(sessionInstance).toBeDefined();
            const sessionData = JSON.parse(sessionInstance.fields.text);
            expect(sessionData).toBeDefined();
            expect(sessionData.src).toEqual(src);
            expect(sessionData.direction).toEqual(direction);
            expect(sessionData["current-src"]).toEqual(overdueTiddlerTemplate.title);
            expect(sessionData["counter-repeat"]).toEqual(0);
            expect(sessionData["counter-overdue"]).toEqual(0);
            expect(sessionData["counter-newcomer"]).toEqual(1);
        })

    it("should create a new session"
        + " and schedule a new tiddler to learn"
        + " when the `order` parameter is set to 'newFirst'", () => {
            // console.warn(">>>");
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const src = "some tag";
            const direction = "both";
            const limit = undefined;
            const groupFilter = undefined;
            const groupStrategy = undefined;
            const order = "newFirst";
            const log = true;
            const idle = false;
            const overdueTiddlerTemplate = {
                title: "overdueTiddler",
                tags: [src, context.tags.scheduledForward],
                'srs-forward-due': new Date().getTime(),
                'srs-forward-last': new Date().getTime()
            };
            const newTiddlerTemplate = { title: "newTiddler", tags: [src, context.tags.scheduledBackward] };
            options.widget.wiki.addTiddler(overdueTiddlerTemplate);
            options.widget.wiki.addTiddler(newTiddlerTemplate);
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            const params = {
                ref: ref,
                src: src,
                direction: direction,
                limit: limit,
                groupFilter: groupFilter,
                groupStrategy: groupStrategy,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                order: order,
                log: log,
                idle: idle
            };
            expect(messageHandler.createSession(params, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const sessionInstance = options.widget.wiki.getTiddler(ref);
            // console.warn(sessionInstance);
            expect(sessionInstance).toBeDefined();
            const sessionData = JSON.parse(sessionInstance.fields.text);
            expect(sessionData).toBeDefined();
            expect(sessionData.src).toEqual(src);
            expect(sessionData.direction).toEqual(direction);
            expect(sessionData["current-src"]).toEqual(newTiddlerTemplate.title);
            expect(sessionData["counter-repeat"]).toEqual(0);
            expect(sessionData["counter-overdue"]).toEqual(1);
            expect(sessionData["counter-newcomer"]).toEqual(0);
        })

    it("should create a new session"
        + " and invoke create hooks when they are defined"
        + " when preCreateHook returns true", () => {
            // console.warn(">>>");
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const src = "some tag";
            const direction = "both";
            const limit = undefined;
            const groupFilter = undefined;
            const groupStrategy = undefined;
            const order = "newFirst";
            const log = true;
            const preCreateHook = "preCreateHook";
            const postCreateHook = "postCreateHook";
            const overdueTiddlerTemplate = {
                title: "overdueTiddler",
                tags: [src, context.tags.scheduledForward],
                'srs-forward-due': new Date().getTime(),
                'srs-forward-last': new Date().getTime()
            };
            options.widget.wiki.addTiddler(overdueTiddlerTemplate);
            const idle = false;
            options.env.macros[preCreateHook] = {
                name: preCreateHook,
                params: [],
                run: function (wiki, params) {
                    console.debug("preCreateHook hook params", params);
                    expect(wiki).toBeDefined();
                    expect(params).toBeDefined();
                    expect(wiki.getTiddler(ref)).toBeUndefined();
                    return true;
                }
            }
            options.env.macros[postCreateHook] = {
                name: postCreateHook,
                params: [],
                run: function (wiki, params) {
                    console.debug("postCreateHook hook params", params);
                    expect(wiki).toBeDefined();
                    expect(params).toBeDefined();
                    expect(params.next).toBeDefined();
                    expect(params.next.src).toEqual(overdueTiddlerTemplate.title);
                    expect(wiki.getTiddler(ref)).toBeDefined();
                }
            }
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            spyOn(options.env.macros[preCreateHook], 'run').and.callThrough();
            spyOn(options.env.macros[postCreateHook], 'run').and.callThrough();
            const params = {
                ref: ref,
                src: src,
                direction: direction,
                limit: limit,
                groupFilter: groupFilter,
                groupStrategy: groupStrategy,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                order: order,
                preCreateHook: preCreateHook,
                postCreateHook: postCreateHook,
                log: log,
                idle: idle
            };
            // consoleSpy.and.callThrough();
            // consoleDebugSpy.and.callThrough();
            expect(messageHandler.createSession(params, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            expect(options.widget.wiki.getTiddler(ref)).toBeDefined();
            expect(options.env.macros[preCreateHook].run).toHaveBeenCalledTimes(1);
            expect(options.env.macros[postCreateHook].run).toHaveBeenCalledTimes(1);
        })

    it("should invoke preCreateHook and shouldn't create a session"
        + " when preCreateHook returns false", () => {
            // console.warn(">>>");
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "$:/temp/srs/session";
            const src = "some tag";
            const direction = "both";
            const limit = undefined;
            const groupFilter = undefined;
            const groupStrategy = undefined;
            const order = "newFirst";
            const log = true;
            const preCreateHook = "preCreateHook";
            const postCreateHook = "postCreateHook";
            const idle = false;
            options.env.macros[preCreateHook] = {
                name: preCreateHook,
                params: [],
                run: function (wiki, params) {
                    console.debug("preCreateHook hook params", params);
                    expect(wiki).toBeDefined();
                    expect(params).toBeDefined();
                    expect(wiki.getTiddler(ref)).toBeUndefined();
                    return false;
                }
            }
            options.env.macros[postCreateHook] = {
                name: postCreateHook,
                params: [],
                run: function (wiki, params) {
                    console.debug("postCreateHook hook params", params);
                    expect(wiki).toBeDefined();
                    expect(params).toBeDefined();
                    expect(wiki.getTiddler(ref)).toBeDefined();
                }
            }
            options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
            spyOn(options.env.macros[preCreateHook], 'run').and.callThrough();
            spyOn(options.env.macros[postCreateHook], 'run').and.callThrough();
            const params = {
                ref: ref,
                src: src,
                direction: direction,
                limit: limit,
                groupFilter: groupFilter,
                groupStrategy: groupStrategy,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                order: order,
                preCreateHook: preCreateHook,
                postCreateHook: postCreateHook,
                log: log,
                idle: idle
            };
            // consoleSpy.and.callThrough();
            // consoleDebugSpy.and.callThrough();
            expect(messageHandler.createSession(params, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            expect(options.widget.wiki.getTiddler(ref)).toBeUndefined();
            expect(options.env.macros[preCreateHook].run).toHaveBeenCalledTimes(1);
            expect(options.env.macros[postCreateHook].run).toHaveBeenCalledTimes(0);
        })

});
