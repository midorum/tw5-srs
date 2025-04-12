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
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
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
        const params = {
            ref: ref,
            idle: idle
        }
        expect(messageHandler.deleteSession(params, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when session is not found", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const idle = true;
        const expectedMessage = "SRS session not found.";
        const params = {
            ref: ref,
            idle: idle
        }
        expect(messageHandler.deleteSession(params, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should delete an exist session", () => {
        const options = utils.setupWiki();
        const ref = "some";
        const idle = false;
        const createParams = {
            ref: ref,
            src: "some",
            direction: "both",
            limit: undefined,
            groupFilter: undefined,
            groupStrategy: undefined,
            groupListFilter: undefined,
            groupLimit: undefined,
            resetAfter: undefined,
            log: true,
            idle: idle
        };
        const deleteParams = {
            ref: ref,
            idle: idle
        }
        expect(messageHandler.createSession(createParams, options.widget)).nothing();
        expect(options.widget.wiki["srs-session"]).toBeDefined();
        expect(messageHandler.deleteSession(deleteParams, options.widget)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        expect(options.widget.wiki["srs-session"]).toBeUndefined();
    })

    it("should delete an exist session"
        + " and invoke delete hooks when they are defined"
        + " when preDestroyHook returns true", () => {
            const options = utils.setupWiki();
            const ref = "some";
            const preDestroyHook = "preDestroyHook";
            const postDestroyHook = "postDestroyHook";
            const idle = false;
            options.env.macros[preDestroyHook] = {
                name: preDestroyHook,
                params: [],
                run: function (wiki, params) {
                    console.debug("preDestroyHook hook params", params);
                    expect(wiki).toBeDefined();
                    expect(params).toBeDefined();
                    expect(options.widget.wiki["srs-session"]).toBeDefined();
                    return true;
                }
            }
            options.env.macros[postDestroyHook] = {
                name: postDestroyHook,
                params: [],
                run: function (wiki, params) {
                    console.debug("postDestroyHook hook params", params);
                    expect(wiki).toBeDefined();
                    expect(params).toBeDefined();
                    expect(options.widget.wiki["srs-session"]).toBeUndefined();
                }
            }
            spyOn(options.env.macros[preDestroyHook], 'run').and.callThrough();
            spyOn(options.env.macros[postDestroyHook], 'run').and.callThrough();
            const createParams = {
                ref: ref,
                src: "some",
                direction: "both",
                limit: undefined,
                groupFilter: undefined,
                groupStrategy: undefined,
                groupListFilter: undefined,
                groupLimit: undefined,
                resetAfter: undefined,
                log: true,
                idle: idle
            };
            const deleteParams = {
                ref: ref,
                preDestroyHook: preDestroyHook,
                postDestroyHook: postDestroyHook,
                idle: idle
            }
            expect(messageHandler.createSession(createParams, options.widget, options.env)).nothing();
            expect(options.widget.wiki["srs-session"]).toBeDefined();
            expect(messageHandler.deleteSession(deleteParams, options.widget, options.env)).nothing();
            expect(Logger.alert).toHaveBeenCalledTimes(0);
            expect(options.widget.wiki["srs-session"]).toBeUndefined();
            expect(options.env.macros[preDestroyHook].run).toHaveBeenCalledTimes(1);
            expect(options.env.macros[postDestroyHook].run).toHaveBeenCalledTimes(1);
        })

});
