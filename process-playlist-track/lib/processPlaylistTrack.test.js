const { PubSub } = require("@google-cloud/pubsub");
const LastFm = require("lastfm-node-client");
const processPlaylistTrack = require("./processPlaylistTrack");

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
  '{"action":"added","track":{"id":"5115232274350080","album":{"name":"djdb/a:f2cb55cd50b6780","kind":"Album","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Album","djdb/a:f2cb55cd50b6780"]},"artist":{"id":9663,"kind":"Artist","path":["Artist",9663]},"categories":[],"class":["PlaylistEvent","PlaylistTrack"],"freeform_label":"Sub Pop","selector":{"id":"6752295795032064","kind":"User","path":["User","6752295795032064"]},"track":{"name":"djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d","kind":"Track","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Track","djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d"]},"established":"2022-03-15T17:31:12.904Z","freeform_album_title":null,"freeform_artist_name":null,"freeform_track_title":null,"lastfm_url_large_image":null,"lastfm_url_med_image":null,"lastfm_url_sm_image":null,"lastfm_urls_processed":null,"modified":"2022-03-15T17:31:12.904Z","playlist":{"id":"5764355425566720","kind":"Playlist","path":["Playlist","5764355425566720"]},"track_number":1,"__key":{"kind":"PlaylistEvent","path":["PlaylistEvent","5115232274350080"],"id":"5115232274350080"}}}',
);
const updatedBuffer = getEncodedBuffer(
  '{"action":"updated","track":{"id":"5115232274350080","album":{"name":"djdb/a:f2cb55cd50b6780","kind":"Album","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Album","djdb/a:f2cb55cd50b6780"]},"artist":{"id":9663,"kind":"Artist","path":["Artist",9663]},"categories":[],"class":["PlaylistEvent","PlaylistTrack"],"freeform_label":"Sub Pop","selector":{"id":"6752295795032064","kind":"User","path":["User","6752295795032064"]},"track":{"name":"djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d","kind":"Track","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Track","djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d"]},"established":"2022-03-15T17:31:12.904Z","freeform_album_title":null,"freeform_artist_name":null,"freeform_track_title":null,"lastfm_url_large_image":null,"lastfm_url_med_image":null,"lastfm_url_sm_image":null,"lastfm_urls_processed":null,"modified":"2022-03-15T17:31:12.904Z","playlist":{"id":"5764355425566720","kind":"Playlist","path":["Playlist","5764355425566720"]},"track_number":1,"__key":{"kind":"PlaylistEvent","path":["PlaylistEvent","5115232274350080"],"id":"5115232274350080"}}}',
);
const deletedBuffer = getEncodedBuffer(
  '{"action":"deleted","track":{"id":"5115232274350080","album":{"name":"djdb/a:f2cb55cd50b6780","kind":"Album","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Album","djdb/a:f2cb55cd50b6780"]},"artist":{"id":9663,"kind":"Artist","path":["Artist",9663]},"categories":[],"class":["PlaylistEvent","PlaylistTrack"],"freeform_label":"Sub Pop","selector":{"id":"6752295795032064","kind":"User","path":["User","6752295795032064"]},"track":{"name":"djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d","kind":"Track","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Track","djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d"]},"established":"2022-03-15T17:31:12.904Z","freeform_album_title":null,"freeform_artist_name":null,"freeform_track_title":null,"lastfm_url_large_image":null,"lastfm_url_med_image":null,"lastfm_url_sm_image":null,"lastfm_urls_processed":null,"modified":"2022-03-15T17:31:12.904Z","playlist":{"id":"5764355425566720","kind":"Playlist","path":["Playlist","5764355425566720"]},"track_number":1,"__key":{"kind":"PlaylistEvent","path":["PlaylistEvent","5115232274350080"],"id":"5115232274350080"}}}',
);

describe("images", () => {
  const albumGetInfo = jest.spyOn(LastFm.prototype, "albumGetInfo");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("are searched for when a track is added", async () => {
    await processPlaylistTrack(getCloudEvent(addedBuffer));
    expect(albumGetInfo).toHaveBeenCalled();
  });

  test("are searched for when a track is updated", async () => {
    await processPlaylistTrack(getCloudEvent(updatedBuffer));
    expect(albumGetInfo).toHaveBeenCalled();
  });

  test("are not searched for when a track is deleted", async () => {
    await processPlaylistTrack(getCloudEvent(deletedBuffer));
    expect(albumGetInfo).not.toHaveBeenCalled();
  });
});

describe("sends PubSub message", () => {
  const publishMessage = jest.fn();
  const topic = jest.spyOn(PubSub.prototype, "topic").mockImplementation(() => {
    return {
      publishMessage,
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sets topic to 'playlist-track-processed'", async () => {
    await processPlaylistTrack(getCloudEvent(addedBuffer));
    expect(topic).toHaveBeenCalledWith("playlist-track-processed");
  });

  test("publishes a message to the topic when a track is added", async () => {
    await processPlaylistTrack(getCloudEvent(addedBuffer));
    expect(publishMessage).toHaveBeenCalled();
  });

  test("message data has an action property", async () => {
    await processPlaylistTrack(getCloudEvent(addedBuffer));
    const message = publishMessage.mock.calls[0][0];
    const json = JSON.parse(Buffer.from(message.data, "base64").toString());
    expect(json).toHaveProperty("action");
  });

  test("message data has a track property", async () => {
    await processPlaylistTrack(getCloudEvent(addedBuffer));
    const message = publishMessage.mock.calls[0][0];
    const json = JSON.parse(Buffer.from(message.data, "base64").toString());
    expect(json).toHaveProperty("track");
  });

  test("publishes a message to the topic when a track is updated", async () => {
    await processPlaylistTrack(getCloudEvent(updatedBuffer));
    expect(publishMessage).toHaveBeenCalled();
  });

  test("publishes a message to the topic when a track is deleted", async () => {
    await processPlaylistTrack(getCloudEvent(deletedBuffer));
    expect(publishMessage).toHaveBeenCalled();
  });

  test("passes through the original message when a track is deleted", async () => {
    await processPlaylistTrack(getCloudEvent(deletedBuffer));
    const message = publishMessage.mock.calls[0][0];
    const encodedData = getEncodedBuffer(message.data);
    expect(encodedData).toEqual(deletedBuffer);
  });
});
