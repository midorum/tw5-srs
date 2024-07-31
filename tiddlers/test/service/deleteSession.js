/*\
title: test/service/deleteSession.js
module-type: library

Unit tests for the deleteSession service.

\*/

const utils = require("test/utils");
const messageHandler = require("$:/plugins/midorum/srs/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;


describe("The deleteSession service", () => {
    var consoleSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.deleteSession).toBeDefined();
    })

    it("should fail when ref argument is not defined", () => {
        const options = utils.setupWiki();
        const ref = undefined;
        const idle = true;
        const expectedMessage = "ref cannot be empty";
        expect(messageHandler.deleteSession(ref, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when session is not found", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const idle = true;
        const expectedMessage = "SRS session not found.";
        expect(messageHandler.deleteSession(ref, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should delete an exist session", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const idle = false;
        expect(messageHandler.createSession(ref, "some", "both", undefined, undefined, undefined, undefined, undefined, true, idle, options.widget)).nothing();
        expect(options.widget.wiki["srs-session"]).toBeDefined();
        expect(messageHandler.deleteSession(ref, idle, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        expect(options.widget.wiki["srs-session"]).toBeUndefined();
    })

});
