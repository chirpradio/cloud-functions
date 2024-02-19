const functions = require('@google-cloud/functions-framework');
const processPlaylistTrack = require("./lib/processPlaylistTrack");

functions.cloudEvent("processPlaylistTrack", processPlaylistTrack);
