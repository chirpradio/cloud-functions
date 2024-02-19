const { PubSub } = require('@google-cloud/pubsub');
const processPlaylistTrack = require("./process-playlist-track");

function getBuffer(str) {
  return Buffer.from(str).toString("base64");
}

const addedBuffer = getBuffer('{"action":"added","track":{"id":"5115232274350080","album":{"name":"djdb/a:f2cb55cd50b6780","kind":"Album","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Album","djdb/a:f2cb55cd50b6780"]},"artist":{"id":9663,"kind":"Artist","path":["Artist",9663]},"categories":[],"class":["PlaylistEvent","PlaylistTrack"],"freeform_label":"Sub Pop","selector":{"id":"6752295795032064","kind":"User","path":["User","6752295795032064"]},"track":{"name":"djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d","kind":"Track","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Track","djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d"]},"established":"2022-03-15T17:31:12.904Z","freeform_album_title":null,"freeform_artist_name":null,"freeform_track_title":null,"lastfm_url_large_image":null,"lastfm_url_med_image":null,"lastfm_url_sm_image":null,"lastfm_urls_processed":null,"modified":"2022-03-15T17:31:12.904Z","playlist":{"id":"5764355425566720","kind":"Playlist","path":["Playlist","5764355425566720"]},"track_number":1,"__key":{"kind":"PlaylistEvent","path":["PlaylistEvent","5115232274350080"],"id":"5115232274350080"}}}');
const updatedBuffer = getBuffer('{"action":"updated","track":{"id":"5115232274350080","album":{"name":"djdb/a:f2cb55cd50b6780","kind":"Album","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Album","djdb/a:f2cb55cd50b6780"]},"artist":{"id":9663,"kind":"Artist","path":["Artist",9663]},"categories":[],"class":["PlaylistEvent","PlaylistTrack"],"freeform_label":"Sub Pop","selector":{"id":"6752295795032064","kind":"User","path":["User","6752295795032064"]},"track":{"name":"djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d","kind":"Track","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Track","djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d"]},"established":"2022-03-15T17:31:12.904Z","freeform_album_title":null,"freeform_artist_name":null,"freeform_track_title":null,"lastfm_url_large_image":null,"lastfm_url_med_image":null,"lastfm_url_sm_image":null,"lastfm_urls_processed":null,"modified":"2022-03-15T17:31:12.904Z","playlist":{"id":"5764355425566720","kind":"Playlist","path":["Playlist","5764355425566720"]},"track_number":1,"__key":{"kind":"PlaylistEvent","path":["PlaylistEvent","5115232274350080"],"id":"5115232274350080"}}}');
const deletedBuffer = getBuffer('{"action":"deleted","track":{"id":"5115232274350080","album":{"name":"djdb/a:f2cb55cd50b6780","kind":"Album","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Album","djdb/a:f2cb55cd50b6780"]},"artist":{"id":9663,"kind":"Artist","path":["Artist",9663]},"categories":[],"class":["PlaylistEvent","PlaylistTrack"],"freeform_label":"Sub Pop","selector":{"id":"6752295795032064","kind":"User","path":["User","6752295795032064"]},"track":{"name":"djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d","kind":"Track","parent":{"id":1458928921272979,"kind":"IndexerTransaction","path":["IndexerTransaction",1458928921272979]},"path":["IndexerTransaction",1458928921272979,"Track","djdb/t:vol01/20160325-124105/1805919be51c53f216cceef12e868749c92b799d"]},"established":"2022-03-15T17:31:12.904Z","freeform_album_title":null,"freeform_artist_name":null,"freeform_track_title":null,"lastfm_url_large_image":null,"lastfm_url_med_image":null,"lastfm_url_sm_image":null,"lastfm_urls_processed":null,"modified":"2022-03-15T17:31:12.904Z","playlist":{"id":"5764355425566720","kind":"Playlist","path":["Playlist","5764355425566720"]},"track_number":1,"__key":{"kind":"PlaylistEvent","path":["PlaylistEvent","5115232274350080"],"id":"5115232274350080"}}}');

describe("sends PubSub message", () => {
  let topic, publishMessage;

  beforeEach(() => {
    publishMessage = jest.fn();
    topic = jest.spyOn(PubSub.prototype, "topic").mockImplementation(() => {
      return {
        publishMessage
      };  
    });
  });

  test("sets topic to 'playlist-track-processed'", async () => {
    await processPlaylistTrack({ data: addedBuffer });
    expect(topic).toHaveBeenCalledWith("playlist-track-processed");
  });

  test("publishes a message to the topic when a track is added", async () => {
    await processPlaylistTrack({ data: addedBuffer });
    expect(publishMessage).toHaveBeenCalled();
  });
});
