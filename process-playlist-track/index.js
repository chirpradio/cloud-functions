const functions = require('@google-cloud/functions-framework');
const processPlaylistTrack = require("./lib/process-playlist-track");

functions.cloudEvent("processPlaylistTrack", processPlaylistTrack);
