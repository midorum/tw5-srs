/*\
title: test/service/srsUtils.js
module-type: library

Unit tests for the utility functions.

\*/

const utils = require("test/utils");
const srsUtils = require("$:/plugins/midorum/srs/modules/utils.js").srsUtils;
const Logger = $tw.utils.Logger.prototype;


describe("The utility method", () => {
    var consoleSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        loggerSpy = spyOn(Logger, 'alert');
    });

    describe("arraysIntersection", () => {

        it("should return intersection of two arrays", () => {
            const arr1 = [1, 2, 3, 4];
            const arr2 = [2, 4, 6, 8, 0];
            const expected = [2, 4];
            const result = srsUtils.arraysIntersection(arr1, arr2);
            expect(result).toEqual(expected);
        });

        it("should return empty array if there are not any common elements in arrays", () => {
            const arr1 = [1, 2, 3, 4];
            const arr2 = [11, 22, 33, 44, 55];
            const expected = [];
            const result = srsUtils.arraysIntersection(arr1, arr2);
            expect(result).toEqual(expected);
        });

        it("should return intersection of two large arrays", () => {
            const arr1 = [];
            for (let i = 0; i < 1000000; i++) {
                if (i % 2 != 0 || i < 10) arr1.push(i);
            }
            const arr2 = [];
            for (let i = 2; i < 100000; i = i + 2) {
                arr2.push(i);
            }
            const expected = [2, 4, 6, 8];
            const result = srsUtils.arraysIntersection(arr1, arr2);
            expect(result).toEqual(expected);
        });

    });

});
