const functions = require('@google-cloud/functions-framework');
const updatePlaylistStorage = require("./lib/updatePlaylistStorage");

functions.cloudEvent("updatePlaylistStorageV2", updatePlaylistStorage);
