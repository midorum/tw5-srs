/*\
title: test/service/schedule.js
module-type: library

Unit tests for schedule service.

\*/

const utils = require("test/utils");
const messageHandler = require("$:/plugins/midorum/srs/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The schedule service", () => {
    var consoleSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.schedule).toBeDefined();
    })

    it("should fail when ref argument is not defined", () => {
        const options = utils.setupWiki();
        const ref = undefined;
        const direction = undefined;
        const idle = true;
        const expectedMessage = "ref cannot be empty";
        expect(messageHandler.schedule(ref, direction, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when direction argument is not defined", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const direction = undefined;
        const idle = true;
        const expectedMessage = "direction cannot be empty and should be one of forward,backward,both";
        expect(messageHandler.schedule(ref, direction, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when direction argument is wrong", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const direction = "wrong";
        const idle = true;
        const expectedMessage = "direction cannot be empty and should be one of forward,backward,both";
        expect(messageHandler.schedule(ref, direction, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should not create redundant tiddlers", () => {
        const options = utils.setupWiki();
        const ref = "not exist";
        const direction = "forward";
        const idle = false;
        expect(messageHandler.schedule(ref, direction, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        expect(options.widget.wiki.getTiddler(ref)).toBeUndefined();
    })

    it("should add the $:/srs/tags/scheduledForward tag to a tiddler"
        + " when direction argument is forward", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "some";
            const direction = "forward";
            const idle = false;
            options.widget.wiki.addTiddler({ title: ref });
            expect(messageHandler.schedule(ref, direction, idle, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const refInstance = options.widget.wiki.getTiddler(ref);
            expect(refInstance).toBeDefined();
            expect(refInstance.fields.tags.includes(context.tags.scheduledForward)).toBeTruthy();
        })

    it("should add the $:/srs/tags/scheduledBackward tag to a tiddler"
        + " when direction argument is backward", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "some";
            const direction = "backward";
            const idle = false;
            options.widget.wiki.addTiddler({ title: ref });
            expect(messageHandler.schedule(ref, direction, idle, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const refInstance = options.widget.wiki.getTiddler(ref);
            expect(refInstance).toBeDefined();
            expect(refInstance.fields.tags.includes(context.tags.scheduledBackward)).toBeTruthy();
        })

    it("should add both the $:/srs/tags/scheduledForward and the $:/srs/tags/scheduledBackward tags to a tiddler"
        + " when direction argument is both", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "some";
            const direction = "both";
            const idle = false;
            options.widget.wiki.addTiddler({ title: ref });
            expect(messageHandler.schedule(ref, direction, idle, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const refInstance = options.widget.wiki.getTiddler(ref);
            expect(refInstance).toBeDefined();
            // console.warn(refInstance);
            expect(refInstance.fields.tags.includes(context.tags.scheduledForward)).toBeTruthy();
            expect(refInstance.fields.tags.includes(context.tags.scheduledBackward)).toBeTruthy();
        })

});
