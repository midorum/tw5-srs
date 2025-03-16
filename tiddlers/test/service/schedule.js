/*\
title: test/service/schedule.js
module-type: library

Unit tests for the schedule service.

\*/

const utils = require("test/utils");
const srsUtils = require("$:/plugins/midorum/srs/modules/utils.js").srsUtils;
const messageHandler = require("$:/plugins/midorum/srs/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The schedule service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.schedule).toBeDefined();
    })

    it("should fail when ref argument is not defined", () => {
        const options = utils.setupWiki();
        const ref = undefined;
        const direction = undefined;
        const preset = undefined;
        const idle = true;
        const expectedMessage = "ref cannot be empty";
        expect(messageHandler.schedule(ref, direction, preset, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when direction argument is not defined", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const direction = undefined;
        const preset = undefined;
        const idle = true;
        const expectedMessage = "direction cannot be empty and should be one of forward,backward,both";
        expect(messageHandler.schedule(ref, direction, preset, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when direction argument is wrong", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const direction = "wrong";
        const preset = undefined;
        const idle = true;
        const expectedMessage = "direction cannot be empty and should be one of forward,backward,both";
        expect(messageHandler.schedule(ref, direction, preset, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail if the target tiddler does not exist", () => {
        const options = utils.setupWiki();
        const ref = "not exist";
        const direction = "forward";
        const preset = undefined;
        const idle = false;
        const expectedMessage = "Tiddler not found";
        expect(messageHandler.schedule(ref, direction, preset, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
        expect(options.widget.wiki.getTiddler(ref)).toBeUndefined();
    })

    it("should add the $:/srs/tags/scheduledForward tag to a tiddler"
        + " when direction argument is forward", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "some";
            const direction = "forward";
            const preset = undefined;
            const idle = false;
            options.widget.wiki.addTiddler({ title: ref });
            expect(messageHandler.schedule(ref, direction, preset,  idle, options.widget)).nothing();
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
            const preset = undefined;
            const idle = false;
            options.widget.wiki.addTiddler({ title: ref });
            expect(messageHandler.schedule(ref, direction, preset, idle, options.widget)).nothing();
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
            const preset = undefined;
            const otherTag = "other";
            const idle = false;
            options.widget.wiki.addTiddler({ title: ref, tags: [otherTag] });
            expect(messageHandler.schedule(ref, direction, preset, idle, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            const refInstance = options.widget.wiki.getTiddler(ref);
            expect(refInstance).toBeDefined();
            // console.warn(refInstance);
            expect(refInstance.fields.tags.includes(otherTag)).toBeTruthy();
            expect(refInstance.fields.tags.includes(context.tags.scheduledForward)).toBeTruthy();
            expect(refInstance.fields.tags.includes(context.tags.scheduledBackward)).toBeTruthy();
        })

    it("should add both the $:/srs/tags/scheduledForward and the $:/srs/tags/scheduledBackward tags to a tiddler"
        + " and set SRS related fields"
        + " when direction argument is both"
        + " and `preset` parameter is defined", () => {
            const options = utils.setupWiki();
            const context = utils.getSrsContext();
            const ref = "some";
            const direction = "both";
            const preset = "true";
            const otherTag = "other";
            const otherTime = new Date(2020, 0, 1).getTime();
            const idle = false;
            const instance = { title: ref, tags: [otherTag] };
            instance[srsUtils.SRS_FORWARD_DUE_FIELD] = otherTime;
            instance[srsUtils.SRS_FORWARD_LAST_FIELD] = otherTime;
            options.widget.wiki.addTiddler(instance);
            expect(messageHandler.schedule(ref, direction, preset, idle, options.widget)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            if(alert = Logger.alert.calls.first()) console.warn(alert.args)
            const refInstance = options.widget.wiki.getTiddler(ref);
            expect(refInstance).toBeDefined();
            // console.warn(refInstance);
            expect(refInstance.fields.tags.includes(otherTag)).toBeTruthy();
            expect(refInstance.fields.tags.includes(context.tags.scheduledForward)).toBeTruthy();
            expect(refInstance.fields.tags.includes(context.tags.scheduledBackward)).toBeTruthy();
            expect(refInstance.fields[srsUtils.SRS_FORWARD_DUE_FIELD]).toBe(otherTime);
            expect(refInstance.fields[srsUtils.SRS_FORWARD_LAST_FIELD]).toBe(otherTime);
            expect(refInstance.fields[srsUtils.SRS_BACKWARD_DUE_FIELD]).toBe(srsUtils.SRS_BASE_TIME);
            expect(refInstance.fields[srsUtils.SRS_BACKWARD_LAST_FIELD]).toBe(srsUtils.SRS_BASE_TIME);
        })

});
