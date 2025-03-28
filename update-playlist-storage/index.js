const functions = require("@google-cloud/functions-framework");
const updatePlaylistStorage = require("./lib/updatePlaylistStorage");
const updatePlaylistStorageFromDatastore = require("./lib/updatePlaylistStorageFromDatastore");

functions.cloudEvent(
  "updatePlaylistStorage",
  updatePlaylistStorageFromDatastore,
);
functions.cloudEvent("updatePlaylistStorageV2", updatePlaylistStorage);
