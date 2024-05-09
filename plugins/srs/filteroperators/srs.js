/*\
title: $:/plugins/midorum/srs/filteroperators/srs.js
type: application/javascript
module-type: filteroperator

A namespace for SRS filters.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

const cache = require("$:/plugins/midorum/srs/modules/cache.js");

exports.srs = function (source, operator, options) {
	const suffixOperator = operator.suffixes[0];
	var srsFilterOperator = cache.getSrsFilterOperator(suffixOperator);
	if (!srsFilterOperator) {
		return ["Error: Operator not found: " + suffixOperator];
	}
	return srsFilterOperator(source, operator, options);
};