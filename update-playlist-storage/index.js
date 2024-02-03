"use strict";

const functions = require('@google-cloud/functions-framework');
const https = require("https");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const publicBucket = storage.bucket("chirpradio-public");
const file = publicBucket.file("playlist.json");
const fileOptions = {
  contentType: "application/json",
  metadata: {
    cacheControl: "public, max-age=10",
  },
};
const url = "https://chirpradio-hrd.appspot.com/api/current_playlist";

const getContent = function (url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(
          new Error("Failed to load page, status code: " + response.statusCode)
        );
      }
      response.setEncoding("utf8");

      const body = [];
      response.on("data", (chunk) => body.push(chunk));
      response.on("end", () => resolve(body.join("")));
    });

    request.on("error", (err) => reject(err));
  });
};

functions.cloudEvent('updatePlaylistStorage', async function () {
  try {
    const currentPlaylist = await getContent(url);
    await file.save(currentPlaylist, fileOptions);    
  } catch (err) {
    console.error(err);
  }
});
