/*\
title: test/utils.js
module-type: library

Utilities for test.

\*/

const srsContextCache = (function () {
    var context;
    return {
        get: function () {
            if (!context) {
                context = {
                    tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/srs/data/tags", [])
                };
            }
            return context;
        }
    }
})();

exports.setupWiki = function (wikiOptions) {
    wikiOptions = wikiOptions || {};
    // Create a wiki
    var wiki = new $tw.Wiki(wikiOptions);
    var tiddlers = [{
        title: "Root",
        text: "Some dummy content"
    }];
    wiki.addTiddlers(tiddlers);
    wiki.addIndexersToWiki();
    var widgetNode = wiki.makeTranscludeWidget("Root", { document: $tw.fakeDocument, parseAsInline: true });
    var container = $tw.fakeDocument.createElement("div");
    widgetNode.render(container, null);
    return {
        wiki: wiki,
        widget: widgetNode,
        contaienr: container
    };
}

exports.getSrsContext = function () {
    return srsContextCache.get();
}