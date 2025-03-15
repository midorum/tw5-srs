/*\
title: SessionDataProducerExample
type: application/javascript
module-type: macro

Produces custom data for SRS learning session
\*/
(function(){
"use strict";

exports.name = "SessionDataProducer";
exports.params = [
  {name: "param"}
];
exports.run = function(param) {
    console.log("SessionDataProducer", param);

    return "SessionDataProducer"+":"+param;
};

})();