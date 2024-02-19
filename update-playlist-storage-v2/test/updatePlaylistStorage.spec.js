const { PubSub } = require('@google-cloud/pubsub');
const updatePlaylistStorage = require("../lib/updatePlaylistStorage");
const libraryTrack = require("./fixtures/libraryTrack");

function getEncodedBuffer(str) {
  return Buffer.from(str).toString("base64");
}

const addedBuffer = getEncodedBuffer(`{"action":"added", "track": ${JSON.stringify(libraryTrack)}}`);


describe.only("sends PubSub message", () => {
  const publishMessage = jest.fn();
  const topic = jest.spyOn(PubSub.prototype, "topic").mockImplementation(() => {
    return {
      publishMessage
    };  
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sets topic to 'playlist-storage-updated'", async () => {
    await updatePlaylistStorage({ data: addedBuffer });
    expect(topic).toHaveBeenCalledWith("playlist-storage-updated");
  });

  test("publishes a message to the topic when a track is added", async () => {
    await updatePlaylistStorage({ data: addedBuffer });
    expect(publishMessage).toHaveBeenCalled();
  });
});