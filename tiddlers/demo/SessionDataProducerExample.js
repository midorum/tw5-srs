/*\
title: SessionDataProducerExample
type: application/javascript
module-type: macro

Produces custom data for the SRS learning session. Mixes data with two tags: "Ocean" and "Country".
\*/
(function(){
"use strict";

exports.name = "SessionDataProducer";
exports.params = [
  {name: "wiki", description: "Object that allows to retrieve data from the wiki"},
  {name: "direction", description: "Direction of the learning choosed by the user: 'forward', 'backward' or 'both'"},
  {name: "limit", description: "Maximum number of items to take"},
  {name: "time", description: "Current time"}
];
exports.run = function(wiki, direction, limit, time) {
    const takeForward = direction === "forward" || direction === "both";
    const takeBackward = direction === "backward" || direction === "both";
    const oceans = wiki.getTitlesWithTag("Ocean");
    const countries = wiki.getTitlesWithTag("Country");
    const mixed = [];
    for (let i = 0; i < Math.max(oceans.length, countries.length); i++) {
      if(oceans[i]) {
        const srsData = wiki.getSrsData(oceans[i]);
        if(takeForward && srsData.forward && (srsData.forward.due || wiki.SRS_BASE_TIME) < time) {
          // take items that are scheduled in forward direction and are due
          mixed.push({
            type: "Ocean",
            src: srsData.forward.src,
            direction: "forward",
            due: srsData.forward.due // for sorting
          });
        } else if(takeBackward && srsData.backward && (srsData.backward.due || wiki.SRS_BASE_TIME) < time) {
          // take items that are scheduled in backward direction (only if they are not already taken in forward direction)
          mixed.push({
            type: "Ocean",
            src: srsData.backward.src,
            direction: "backward",
            due: srsData.backward.due // for sorting
          });
        }
      }
      if(countries[i]) {
        const srsData = wiki.getSrsData(countries[i]);
        if(takeForward && srsData.forward && (srsData.forward.due || wiki.SRS_BASE_TIME) < time) {
          // take items that are scheduled in forward direction and are due
          mixed.push({
            type: "Country",
            src: srsData.forward.src,
            direction: "forward",
            due: srsData.forward.due // for sorting
          });
        } else if(takeBackward && srsData.backward && (srsData.backward.due || wiki.SRS_BASE_TIME) < time) {
          // take items that are scheduled in backward direction (only if they are not already taken in forward direction)
          mixed.push({
            type: "Country",
            src: srsData.backward.src,
            direction: "backward",
            due: srsData.backward.due // for sorting
          });
        }
      }
    }
    const result = mixed.sort((a, b) => a.due - b.due).slice(0, limit); // sort by due date and take only the first `limit` items
    console.warn("result", result);
    return result;
};

})();