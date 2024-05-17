/*\
title $:/plugins/midorum/srs/filteroperators/gtu.js
type: application/javascript
module-type: llsfilteroperator

Greatest time unit string representation

\*/

(function () {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	const SEC = 1000;
	const MIN = SEC * 60;
	const HOUR = MIN * 60;
	const DAY = HOUR * 24;
	const MONTH = DAY * 30;
	const YEAR = DAY * 365;

	const utils = require("$:/plugins/midorum/srs/modules/utils.js");

	exports.gtu = function (source, operator, options) {
		const results = [];
		source(function (tiddler, title) {
			const i = utils.parseInteger(title);
			if (!i || i <= 0) {
				results.push(title);
			} else {
				var r = extractTimeUnit(i, YEAR);
				if (!r) r = extractTimeUnit(i, MONTH);
				if (!r) r = extractTimeUnit(i, DAY);
				if (!r) r = extractTimeUnit(i, HOUR);
				if (!r) r = extractTimeUnit(i, MIN);
				if (!r) r = extractTimeUnit(i, SEC);
				if (!r) r = extractTimeUnit(i, 1);
				results.push(r);
			}
		});
		return results;
	};

	function extractTimeUnit(i, unit) {
		const r = i / unit;
		if (r < 1) return undefined;
		return ((Math.floor(r * 10)) / 10) + " "
			+ (unit === YEAR ? "year(s)"
				: unit === MONTH ? "month(s)"
					: unit === DAY ? "day(s)"
						: unit === HOUR ? "hour(s)"
							: unit === MIN ? "min"
								: unit == SEC ? "sec"
									: "millis");
	}

})();
