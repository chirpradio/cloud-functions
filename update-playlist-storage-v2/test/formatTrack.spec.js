const formatTrack = require("../lib/formatTrack");
const libraryTrack = require("./fixtures/libraryTrack");
const libraryResult = require("./fixtures/libraryResult.json");
const freeformTrack = require("./fixtures/freeformTrack");
const freeformResult = require("./fixtures/freeformResult.json");
const noImagesTrack = require("./fixtures/noImagesTrack");
const noImagesResult = require("./fixtures/noImagesResult.json");

function createTableTest(track, result) {
  return () => {
    const formatted = formatTrack(track);
    const results = Object.entries(result);
  
    test.each(results)("%s equals %p", (key, value) => {
      expect(formatted[key]).toEqual(value);
    });
  }
}

describe("For a library track", createTableTest(libraryTrack, libraryResult));
describe("For a freeform track", createTableTest(freeformTrack, freeformResult));
describe("For a library track without images", createTableTest(noImagesTrack, noImagesResult));
