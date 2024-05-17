/*\
title: $:/plugins/midorum/srs/widgets/srs-action-setfield-deferred.js
type: application/javascript
module-type: widget

Action widget to set a single field or index on a tiddler.
Extended with 'defer' attribute.

\*/
(function () {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	var Widget = require("$:/core/modules/widgets/widget.js").widget;
	const utils = require("$:/plugins/midorum/srs/modules/utils.js");

	var SrsSetFieldDefferedWidget = function (parseTreeNode, options) {
		this.initialise(parseTreeNode, options);
	};

	/*
	Inherit from the base widget class
	*/
	SrsSetFieldDefferedWidget.prototype = new Widget();

	/*
	Render this widget into the DOM
	*/
	SrsSetFieldDefferedWidget.prototype.render = function (parent, nextSibling) {
		this.computeAttributes();
		this.execute();
	};

	/*
	Compute the internal state of the widget
	*/
	SrsSetFieldDefferedWidget.prototype.execute = function () {
		this.actionTiddler = this.getAttribute("$tiddler") || (!this.hasParseTreeNodeAttribute("$tiddler") && this.getVariable("currentTiddler"));
		this.actionField = this.getAttribute("$field");
		this.actionIndex = this.getAttribute("$index");
		this.actionValue = this.getAttribute("$value");
		this.actionTimestamp = this.getAttribute("$timestamp", "yes") === "yes";
		this.defer = utils.parseInteger(this.getAttribute("$defer"));
	};

	/*
	Refresh the widget by ensuring our attributes are up to date
	*/
	SrsSetFieldDefferedWidget.prototype.refresh = function (changedTiddlers) {
		// Nothing to refresh
		return this.refreshChildren(changedTiddlers);
	};

	/*
	Invoke the action associated with this widget
	*/
	SrsSetFieldDefferedWidget.prototype.invokeAction = function (triggeringWidget, event) {
		if (this.defer) {
			setTimeout(this.action, this.defer, this, triggeringWidget, event);
		} else {
			this.action(this);
		}
		return true; // Action was invoked
	};

	SrsSetFieldDefferedWidget.prototype.action = function (self, triggeringWidget, event) {
		var options = {};
		if (self.actionTiddler) {
			options.suppressTimestamp = !self.actionTimestamp;
			if ((typeof self.actionField == "string") || (typeof self.actionIndex == "string") || (typeof self.actionValue == "string")) {
				self.wiki.setText(self.actionTiddler, self.actionField, self.actionIndex, self.actionValue, options);
			}
			$tw.utils.each(self.attributes, function (attribute, name) {
				if (name.charAt(0) !== "$") {
					self.wiki.setText(self.actionTiddler, name, undefined, attribute, options);
				}
			});
		}
	}

	exports["srs-action-setfield-deferred"] = SrsSetFieldDefferedWidget;

})();
