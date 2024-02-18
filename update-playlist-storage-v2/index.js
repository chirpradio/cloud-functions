const { formatTrack, loadJson, updateNowPlaying } = require("lib");
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

exports.updatePlaylistStorage = async function (message) {
  try {
    const previousPlaylist = await loadJson(file);
    const msgData = JSON.parse(Buffer.from(message.data, "base64").toString());
    const track = formatTrack(msgData.track);
    const currentPlaylist = updateNowPlaying(track, previousPlaylist);
    await file.save(JSON.stringify(currentPlaylist), FILE_OPTIONS);
  } catch (error) {
    console.error(error);
  } finally {
    await pubsub.topic("playlist-storage-updated").publishMessage({
      data: Buffer.from(message.data)
    });
  }
};
