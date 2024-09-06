const functions = require("@google-cloud/functions-framework");
const { handleEvent } = require("./lib/createPlaylistEvent");

// Register an HTTP function with the Functions Framework that will be executed
// when you make an HTTP request to the deployed function's endpoint.
functions.http("createPlaylistEvent", handleEvent);
