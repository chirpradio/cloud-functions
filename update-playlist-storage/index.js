const functions = require("@google-cloud/functions-framework");
const updatePlaylistStorage = require("./lib/updatePlaylistStorage");
const updatePlaylistStorageFromDJDB = require("./lib/updatePlaylistStorageFromDJDB");

functions.cloudEvent("updatePlaylistStorage", updatePlaylistStorageFromDJDB);
functions.cloudEvent("updatePlaylistStorageV2", updatePlaylistStorage);
