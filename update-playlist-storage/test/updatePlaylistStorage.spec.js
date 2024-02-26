const { PubSub } = require("@google-cloud/pubsub");
const updatePlaylistStorage = require("../lib/updatePlaylistStorage");
const libraryTrack = require("./fixtures/libraryTrack");

function getEncodedBuffer(str) {
  return Buffer.from(str).toString("base64");
}

function getCloudEvent(data) {
  return {
    data: {
      message: {
        data,
      },
    },
  };
}

const addedBuffer = getEncodedBuffer(
  `{"action":"added", "track": ${JSON.stringify(libraryTrack)}}`,
);
const updatedBuffer = getEncodedBuffer(
  `{"action":"updated", "track": ${JSON.stringify(libraryTrack)}}`,
);
const deletedBuffer = getEncodedBuffer(
  `{"action":"deleted", "track": ${JSON.stringify(libraryTrack)}}`,
);

describe.only("sends PubSub message", () => {
  const publishMessage = jest.fn();
  const topic = jest.spyOn(PubSub.prototype, "topic").mockImplementation(() => {
    return {
      publishMessage,
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sets topic to 'playlist-storage-updated'", async () => {
    await updatePlaylistStorage(getCloudEvent(addedBuffer));
    expect(topic).toHaveBeenCalledWith("playlist-storage-updated");
  });

  test("publishes a message to the topic when a track is added", async () => {
    await updatePlaylistStorage(getCloudEvent(addedBuffer));
    expect(publishMessage).toHaveBeenCalled();
  });

  test("passes through the original message when a track is added", async () => {
    await updatePlaylistStorage(getCloudEvent(addedBuffer));
    const message = publishMessage.mock.calls[0][0];
    const encodedData = getEncodedBuffer(message.data);
    expect(encodedData).toEqual(addedBuffer);
  });

  test("does not publish a message when a track is updated", async () => {
    await updatePlaylistStorage(getCloudEvent(updatedBuffer));
    expect(publishMessage).not.toHaveBeenCalled();
  });

  test("does not publish a message when a track is deleted", async () => {
    await updatePlaylistStorage(getCloudEvent(deletedBuffer));
    expect(publishMessage).not.toHaveBeenCalled();
  });
});
