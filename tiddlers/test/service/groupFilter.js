/*\
title: test/service/groupFilter.js
module-type: library

Unit tests for the createSession service with a group strategy

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

    describe("with oneFromGroup group strategy", () => {
        // const groupStrategy = "oneFromGroup";

        it("should create a new session"
            + " and schedule three tiddlers to learn (one from each group)"
            + " and set current tiddler"
            + " when direction is both", () => {
                const options = utils.setupWiki();
                const context = utils.getSrsContext();
                const ref = "$:/temp/srs/session";
                const src = "some tag";
                const groupTag = "group tag"
                const direction = "both";
                const limit = undefined;
                const groupFilter = "[<currentTiddler>tags[]tag[" + groupTag + "]]";
                const groupStrategy = "oneFromGroup";
                const log = true;
                const idle = false;
                createSourceTiddlers(src, groupTag, options, context);
                expect(messageHandler.createSession(ref, src, direction, limit, groupFilter, groupStrategy, log, idle, options.widget)).nothing();
                expect(Logger.alert).toHaveBeenCalledTimes(0);
                const sessionInstance = options.widget.wiki.getTiddler(ref);
                // console.warn(sessionInstance);
                expect(sessionInstance).toBeDefined();
                const sessionData = JSON.parse(sessionInstance.fields.text);
                expect(sessionData).toBeDefined();
                expect(sessionData.src).toEqual(src);
                expect(sessionData.direction).toEqual(direction);
                expect(sessionData["current-src"]).toBeDefined();
                expect(sessionData["current-direction"]).toBeDefined();
                expect(sessionData["counter-repeat"]).toEqual(1);
                expect(sessionData["counter-overdue"]).toEqual(0);
                expect(sessionData["counter-newcomer"]).toEqual(2);
            })
    });

});

function createSourceTiddlers(src, groupTag, options, context) {
    const group1Template = { title: "group1", tags: [groupTag] };
    const group2Template = { title: "group2", tags: [groupTag] };
    const group3Template = { title: "group3", tags: [groupTag] };
    const scheduled1Group1Template = { title: "scheduled1Group1", tags: [src, group1Template.title, context.tags.scheduledForward, context.tags.scheduledBackward] };
    const scheduled2Group1Template = { title: "scheduled2Group1", tags: [src, group1Template.title, context.tags.scheduledForward, context.tags.scheduledBackward] };
    const scheduled3Group1Template = { title: "scheduled3Group1", tags: [src, group1Template.title, context.tags.scheduledForward, context.tags.scheduledBackward] };
    const scheduled1Group2Template = { title: "scheduled1Group2", tags: [src, group2Template.title, context.tags.scheduledForward, context.tags.scheduledBackward] };
    const scheduled2Group2Template = { title: "scheduled2Group2", tags: [src, group2Template.title, context.tags.scheduledForward, context.tags.scheduledBackward] };
    const scheduled3Group2Template = { title: "scheduled3Group2", tags: [src, group2Template.title, context.tags.scheduledForward, context.tags.scheduledBackward] };
    const scheduled1Group3Template = { title: "scheduled1Group3", tags: [src, group3Template.title, context.tags.scheduledForward, context.tags.scheduledBackward] };
    const scheduled2Group3Template = { title: "scheduled2Group3", tags: [src, group3Template.title, context.tags.scheduledForward, context.tags.scheduledBackward] };
    const scheduled3Group3Template = { title: "scheduled3Group3", tags: [src, group3Template.title, context.tags.scheduledForward, context.tags.scheduledBackward] };
    options.widget.wiki.addTiddler(group1Template);
    options.widget.wiki.addTiddler(group2Template);
    options.widget.wiki.addTiddler(group3Template);
    options.widget.wiki.addTiddler(scheduled1Group1Template);
    options.widget.wiki.addTiddler(scheduled2Group1Template);
    options.widget.wiki.addTiddler(scheduled3Group1Template);
    options.widget.wiki.addTiddler(scheduled1Group2Template);
    options.widget.wiki.addTiddler(scheduled2Group2Template);
    options.widget.wiki.addTiddler(scheduled3Group2Template);
    options.widget.wiki.addTiddler(scheduled1Group3Template);
    options.widget.wiki.addTiddler(scheduled2Group3Template);
    options.widget.wiki.addTiddler(scheduled3Group3Template);
}
