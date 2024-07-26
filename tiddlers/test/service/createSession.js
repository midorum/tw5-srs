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
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.createSession).toBeDefined();
    })

    it("should fail when ref argument is not defined", () => {
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
        expect(messageHandler.createSession(ref, src, direction, limit, groupFilter, groupStrategy, log, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when src argument is not defined", () => {
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
        expect(messageHandler.createSession(ref, src, direction, limit, groupFilter, groupStrategy, log, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when direction argument is wrong", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const src = "some";
        const direction = "wrong";
        const limit = undefined;
        const groupFilter = undefined;
        const groupStrategy = undefined;
        const log = undefined;
        const idle = true;
        const expectedMessage = "direction argument should be one of [forward,backward,both]";
        expect(messageHandler.createSession(ref, src, direction, limit, groupFilter, groupStrategy, log, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should create a new session"
        + " and schedule one tiddler to learn"
        + " and set current tiddler"
        + " when direction is forward", () => {
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
            expect(messageHandler.createSession(ref, src, direction, limit, groupFilter, groupStrategy, log, idle, options.widget)).nothing();
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
        + " and set current tiddler"
        + " when direction is backward", () => {
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
            expect(messageHandler.createSession(ref, src, direction, limit, groupFilter, groupStrategy, log, idle, options.widget)).nothing();
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
        + " and set current tiddler"
        + " when direction is both", () => {
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
            expect(messageHandler.createSession(ref, src, direction, limit, groupFilter, groupStrategy, log, idle, options.widget)).nothing();
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

});
