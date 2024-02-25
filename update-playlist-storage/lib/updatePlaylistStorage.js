/*
  Update public playlist JSON based on a PubSub event from the
  NextUp playlist pipeline: https://chirpradio.github.io/nextup/#playlist-pipeline
*/
const formatTrack = require("./formatTrack");
const loadJson = require("./loadJson");
const updateNowPlaying = require("./updateNowPlaying");
const { PubSub } = require("@google-cloud/pubsub");
const { Storage } = require("@google-cloud/storage");

const pubsub = new PubSub();
const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET);
const file = bucket.file(process.env.FILE_NAME);
const FILE_OPTIONS = {
  contentType: "application/json",
  metadata: {
    cacheControl: "public, max-age=10",
  },
};

module.exports = async function (cloudEvent) {
  const msgData = Buffer.from(cloudEvent.data.message.data, "base64");
  const data = JSON.parse(msgData.toString());
  if (data.action === "added") {
    try {
      const previousPlaylist = await loadJson(file);
      const track = formatTrack(data.track);
      const currentPlaylist = updateNowPlaying(track, previousPlaylist);
      await file.save(JSON.stringify(currentPlaylist), FILE_OPTIONS);
      await pubsub.topic("playlist-storage-updated").publishMessage({
        data: msgData,
      });
    } catch (error) {
      console.error(error);
    }
  }
};
