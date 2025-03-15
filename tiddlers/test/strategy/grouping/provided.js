/*\
title: test/strategy/grouping/provided.js
module-type: library

Unit tests for the createSession service with a provided grouping strategy

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

    
    describe("with provided group strategy", () => {

        it("should fail"
            + " when the 'listProvider' does not exist", () => {
                // console.warn(">>>");
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const listProvider = "listProvider";
                const src = undefined;
                const limit = undefined;
                const groupStrategy = "provided";
                const log = true;
                const idle = false;
                options.env.macros[listProvider] = undefined;
                const expectedMessage = "'listProvider' (listProvider) not found. Check if you defined the macro properly.";
                const params = {
                    ref: ref,
                    src: undefined,
                    direction: undefined,
                    limit: limit,
                    groupFilter: undefined,
                    groupStrategy: groupStrategy,
                    groupListFilter: undefined,
                    groupLimit: undefined,
                    resetAfter: undefined,
                    listProvider: listProvider,
                    log: log,
                    idle: idle
                };
                expect(messageHandler.createSession(params, options.widget, options.env)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(1);
                const results = Logger.alert.calls.first().args;
                expect(results[0]).toContain(expectedMessage);
            })

        it("should fail"
            + " when the 'listProvider' macro does not return an array", () => {
                // console.warn(">>>");
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const listProvider = "listProvider";
                const src = undefined;
                const limit = undefined;
                const groupStrategy = "provided";
                const log = true;
                const idle = false;
                options.env.macros[listProvider] = {
                    name: listProvider,
                    params: [],
                    run: function(wiki, limit, time) {
                        return {};
                    }
                }
                const expectedMessage = "'listProvider' (listProvider) should return an array";
                const params = {
                    ref: ref,
                    src: undefined,
                    direction: undefined,
                    limit: limit,
                    groupFilter: undefined,
                    groupStrategy: groupStrategy,
                    groupListFilter: undefined,
                    groupLimit: undefined,
                    resetAfter: undefined,
                    listProvider: listProvider,
                    log: log,
                    idle: idle
                };
                expect(messageHandler.createSession(params, options.widget, options.env)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(1);
                const results = Logger.alert.calls.first().args;
                expect(results[0]).toContain(expectedMessage);
            })

        it("should fail"
            + " when the 'listProvider' macro returns a list item without the `type` attribute", () => {
                // console.warn(">>>");
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const listProvider = "listProvider";
                const src = undefined;
                const limit = undefined;
                const groupStrategy = "provided";
                const log = true;
                const idle = false;
                options.env.macros[listProvider] = {
                    name: listProvider,
                    params: [],
                    run: function(wiki, limit, time) {
                        return [
                            {}
                        ];
                    }
                }
                const expectedMessage = "invalid item format: missed `type` attribute";
                const params = {
                    ref: ref,
                    src: undefined,
                    direction: undefined,
                    limit: limit,
                    groupFilter: undefined,
                    groupStrategy: groupStrategy,
                    groupListFilter: undefined,
                    groupLimit: undefined,
                    resetAfter: undefined,
                    listProvider: listProvider,
                    log: log,
                    idle: idle
                };
                expect(messageHandler.createSession(params, options.widget, options.env)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(1);
                const results = Logger.alert.calls.first().args;
                expect(results[0]).toContain(expectedMessage);
            })

        it("should fail"
            + " when the 'listProvider' macro returns a list item without the `src` attribute", () => {
                // console.warn(">>>");
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const listProvider = "listProvider";
                const src = undefined;
                const limit = undefined;
                const groupStrategy = "provided";
                const log = true;
                const idle = false;
                options.env.macros[listProvider] = {
                    name: listProvider,
                    params: [],
                    run: function(wiki, limit, time) {
                        return [
                            {
                                type: "type"
                            }
                        ];
                    }
                }
                const expectedMessage = "invalid item format: missed `src` attribute";
                const params = {
                    ref: ref,
                    src: undefined,
                    direction: undefined,
                    limit: limit,
                    groupFilter: undefined,
                    groupStrategy: groupStrategy,
                    groupListFilter: undefined,
                    groupLimit: undefined,
                    resetAfter: undefined,
                    listProvider: listProvider,
                    log: log,
                    idle: idle
                };
                expect(messageHandler.createSession(params, options.widget, options.env)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(1);
                const results = Logger.alert.calls.first().args;
                expect(results[0]).toContain(expectedMessage);
            })

        it("should fail"
            + " when the 'listProvider' macro returns a list item without the `direction` attribute", () => {
                // console.warn(">>>");
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const listProvider = "listProvider";
                const src = undefined;
                const limit = undefined;
                const groupStrategy = "provided";
                const log = true;
                const idle = false;
                options.env.macros[listProvider] = {
                    name: listProvider,
                    params: [],
                    run: function(wiki, limit, time) {
                        return [
                            {
                                type: "type",
                                src: "src"
                            }
                        ];
                    }
                }
                const expectedMessage = "invalid item format: missed `direction` attribute";
                const params = {
                    ref: ref,
                    src: undefined,
                    direction: undefined,
                    limit: limit,
                    groupFilter: undefined,
                    groupStrategy: groupStrategy,
                    groupListFilter: undefined,
                    groupLimit: undefined,
                    resetAfter: undefined,
                    listProvider: listProvider,
                    log: log,
                    idle: idle
                };
                expect(messageHandler.createSession(params, options.widget, options.env)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(1);
                const results = Logger.alert.calls.first().args;
                expect(results[0]).toContain(expectedMessage);
            })

        it("should fail"
            + " when the 'listProvider' macro returns a list item with the wrong `direction` attribute", () => {
                // console.warn(">>>");
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const listProvider = "listProvider";
                const src = undefined;
                const limit = undefined;
                const groupStrategy = "provided";
                const log = true;
                const idle = false;
                options.env.macros[listProvider] = {
                    name: listProvider,
                    params: [],
                    run: function(wiki, limit, time) {
                        return [
                            {
                                type: "type",
                                src: "src",
                                direction: "wrong"
                            }
                        ];
                    }
                }
                const expectedMessage = "item direction should be one of [forward,backward]";
                const params = {
                    ref: ref,
                    src: undefined,
                    direction: undefined,
                    limit: limit,
                    groupFilter: undefined,
                    groupStrategy: groupStrategy,
                    groupListFilter: undefined,
                    groupLimit: undefined,
                    resetAfter: undefined,
                    listProvider: listProvider,
                    log: log,
                    idle: idle
                };
                expect(messageHandler.createSession(params, options.widget, options.env)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(1);
                const results = Logger.alert.calls.first().args;
                expect(results[0]).toContain(expectedMessage);
            })

        it("should fail"
            + " when could not find a tiddler for a provided list item", () => {
                // console.warn(">>>");
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const listProvider = "listProvider";
                const src = undefined;
                const limit = undefined;
                const groupStrategy = "provided";
                const log = true;
                const idle = false;
                options.env.macros[listProvider] = {
                    name: listProvider,
                    params: [],
                    run: function(wiki, limit, time) {
                        return [
                            {
                                type: "type",
                                src: "src",
                                direction: "forward"
                            }
                        ];
                    }
                }
                const expectedMessage = "could not find a tiddler or it isn't sheduduled";
                const params = {
                    ref: ref,
                    src: undefined,
                    direction: undefined,
                    limit: limit,
                    groupFilter: undefined,
                    groupStrategy: groupStrategy,
                    groupListFilter: undefined,
                    groupLimit: undefined,
                    resetAfter: undefined,
                    listProvider: listProvider,
                    log: log,
                    idle: idle
                };
                expect(messageHandler.createSession(params, options.widget, options.env)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(1);
                const results = Logger.alert.calls.first().args;
                expect(results[0]).toContain(expectedMessage);
            })

        it("should create a new session"
            + " and schedule two tiddlers to learn"
            + " and set the current tiddler"
            + " from a custom list", () => {
                // console.warn(">>>");
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const listProvider = "listProvider";
                const src1 = "src1";
                const src2 = "src2";
                const limit = undefined;
                const groupStrategy = "provided";
                const log = true;
                const idle = false;
                const src1Template = { title: "src1_scheduledForward", tags: [src1, context.tags.scheduledForward] };
                const src2Template = { title: "src2_scheduledBackward", tags: [src2, context.tags.scheduledBackward] };
                options.env.macros[listProvider] = {
                    name: listProvider,
                    params: [],
                    run: function(wiki, limit, time) {
                        // wiki.getTiddlersWithTag(src1).forEach(tiddler => {
                        //     console.warn(tiddler);
                        // });
                        // wiki.filterTiddlers("[tag[" + src2 + "]]").forEach(tiddler => {
                        //     console.warn(tiddler);
                        // });
                        // wiki.allTitles().forEach(tiddler => {
                        //     console.warn(tiddler, wiki.tiddlerExists(tiddler), wiki.getSrsData(tiddler));
                        // });
                        return [
                            {
                                type: src1,
                                src: src1Template.title,
                                direction: "forward"
                            },
                            {
                                type: src2,
                                src: src2Template.title,
                                direction: "backward"
                            }
                        ];
                    }
                }
                options.widget.wiki.addTiddler(src1Template);
                options.widget.wiki.addTiddler(src2Template);
                options.widget.wiki.addTiddler({ title: "$:/config/midorum/srs/scheduling/strategy", text: "linear" });
                const params = {
                    ref: ref,
                    src: undefined,
                    direction: undefined,
                    limit: limit,
                    groupFilter: undefined,
                    groupStrategy: groupStrategy,
                    groupListFilter: undefined,
                    groupLimit: undefined,
                    resetAfter: undefined,
                    listProvider: listProvider,
                    log: log,
                    idle: idle
                };
                // create a session
                expect(messageHandler.createSession(params, options.widget, options.env)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(0);
                if(alert = Logger.alert.calls.first()) console.warn(alert.args)
                var sessionInstance = options.widget.wiki.getTiddler(ref);
                // console.warn(sessionInstance);
                expect(sessionInstance).toBeDefined();
                var sessionData = JSON.parse(sessionInstance.fields.text);
                expect(sessionData).toBeDefined();
                expect(sessionData.src).toEqual("provided");
                expect(sessionData["current-src"]).toEqual(src1Template.title);
                expect(sessionData["current-direction"]).toEqual("forward");
                expect(sessionData["current-type"]).toEqual(src1);
                expect(sessionData["counter-repeat"]).toEqual(0);
                expect(sessionData["counter-overdue"]).toEqual(0);
                expect(sessionData["counter-newcomer"]).toEqual(1);
                // answer first question
                expect(messageHandler.commitAnswer(ref, "onward", log, idle, options.widget)).nothing();
                sessionInstance = options.widget.wiki.getTiddler(ref);
                // console.warn(sessionInstance);
                expect(sessionInstance).toBeDefined();
                sessionData = JSON.parse(sessionInstance.fields.text);
                expect(sessionData).toBeDefined();
                expect(sessionData["current-src"]).toEqual(src2Template.title);
                expect(sessionData["current-direction"]).toEqual("backward");
                expect(sessionData["current-type"]).toEqual(src2);
                expect(sessionData["counter-repeat"]).toEqual(1);
                expect(sessionData["counter-overdue"]).toEqual(0);
                expect(sessionData["counter-newcomer"]).toEqual(0);
                // answer second question
                expect(messageHandler.commitAnswer(ref, "onward", log, idle, options.widget)).nothing();
                sessionInstance = options.widget.wiki.getTiddler(ref);
                // console.warn(sessionInstance);
                expect(sessionInstance).toBeDefined();
                sessionData = JSON.parse(sessionInstance.fields.text);
                expect(sessionData).toBeDefined();
                expect(sessionData["current-src"]).toBeUndefined();
                expect(sessionData["current-direction"]).toBeUndefined();
                expect(sessionData["current-type"]).toBeUndefined();
                expect(sessionData["counter-repeat"]).toEqual(2);
                expect(sessionData["counter-overdue"]).toEqual(0);
                expect(sessionData["counter-newcomer"]).toEqual(0);
            })

        });

});
