const formatTrack = require("./formatTrack");
const { Datastore } = require("@google-cloud/datastore");
const datastore = new Datastore();
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET);
const file = bucket.file(process.env.FILE_NAME);

async function getPlaylistEvents(playlistKey) {
  const query = datastore
    .createQuery("PlaylistEvent")
    .filter("class", "=", "PlaylistTrack")
    .filter("playlist", "=", playlistKey)
    .order("established", {
      descending: true,
    })
    .limit(6);
  const [events] = await datastore.runQuery(query);
  return events;
}

async function getEntitiesByKind(kind, keys) {
  let options = {};
  if (kind === "Album") {
    options = {
      wrapNumbers: {
        integerTypeCastFunction: datastore.int,
        properties: ["album_id"],
      },
    };
  }
  const [entities] = await datastore.get(keys, options);
  return { kind, entities };
}

async function getAssociatedEntities(events) {
  const kindsWithKeys = {
    Album: events.filter((event) => event.album).map((event) => event.album),
    Artist: events.filter((event) => event.artist).map((event) => event.artist),
    Track: events.filter((event) => event.track).map((event) => event.track),
    User: events.map((event) => event.selector),
  };

  const promises = Object.entries(kindsWithKeys).map(([kind, keys]) =>
    getEntitiesByKind(kind, keys),
  );

  const results = await Promise.all(promises);
  return results.reduce((acc, { kind, entities }) => {
    acc[kind] = entities;
    return acc;
  }, {});
}

function replace(event, eventProp, associations, kind) {
  if (event[eventProp]) {
    /* 
      Albums and Tracks use "name" consistently
      Users use "id" consistently
      but Artists have either "name" or "id" properties
      depending on when they were imported
    */
    const keyProp = event[eventProp].hasOwnProperty("name") ? "name" : "id";
    event[eventProp] = associations[kind].find(
      (entity) => {        
        return entity[datastore.KEY][keyProp] === event[eventProp][keyProp];
      },
    );
  }
}

async function join(events, associations) {
  for (const event of events) {
    replace(event, "selector", associations, "User");
    replace(event, "album", associations, "Album");
    replace(event, "artist", associations, "Artist");
    replace(event, "track", associations, "Track");    

    const [urlSafeKey] = await datastore.keyToLegacyUrlSafe(
      event[datastore.KEY],
      "s~",
    );
    event.id = urlSafeKey;
    // makes it easier to reuse formatTrack
    event.established = event.established.toISOString();
  }
}

module.exports = async function () {
  try {
    const playlistKey = datastore.key([
      "Playlist",
      parseInt(process.env.PLAYLIST_ID, 10),
    ]);
    const events = await getPlaylistEvents(playlistKey);
    const associations = await getAssociatedEntities(events);
    await join(events, associations);
    const output = {
      now_playing: formatTrack(events.shift()),
      recently_played: events.map(formatTrack),
    };
    await file.save(JSON.stringify(output), {
      contentType: "application/json",
      metadata: {
        cacheControl: "public, max-age=10",
      },
    });
  } catch (error) {
    console.error(error);
  }
};
