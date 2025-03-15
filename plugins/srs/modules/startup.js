/*\
title: $:/plugins/midorum/srs/modules/startup.js
type: application/javascript
module-type: startup

Adds listeners for SRS messages.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const messageHandler = require("$:/plugins/midorum/srs/modules/message-handler.js");

  // Export name and synchronous status
  exports.name = "srs-startup";
  exports.after = ["startup"];
  exports.synchronous = true;

  exports.startup = function () {

    $tw.rootWidget.addEventListener("tm-srs-schedule", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.schedule(params.ref, params.direction, params.idle, widget);
    });

    $tw.rootWidget.addEventListener("tm-srs-unschedule", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.unschedule(params.ref, params.direction, params.idle, widget);
    });

    $tw.rootWidget.addEventListener("tm-srs-create-session", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.createSession(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-srs-delete-session", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.deleteSession(params.ref, params.idle, widget);
    });

    $tw.rootWidget.addEventListener("tm-srs-commit-answer", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.commitAnswer(params.ref, params.answer, params.log, params.idle, widget);
    });

  };

})();