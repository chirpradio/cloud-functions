const util = require("util");
const nextup = require("./nextup.service");

const DJ_PLAY_COOLDOWN_MINUTES = process.env.DJ_PLAY_COOLDOWN_MINUTES ?? 20;
const validTags = [
  "local_classic",
  "local_current",
  "heavy_rotation",
  "light_rotation",
];

function getXMinutesPrevious(x) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - x);
  return date.valueOf();
}

async function getMostRecentPlays(pastMinutes = DJ_PLAY_COOLDOWN_MINUTES) {
  const params = {
    start: getXMinutesPrevious(pastMinutes),
  };
  return (await nextup.getPlaylist(params)).filter(
    (playlistEvent) => playlistEvent.selector !== null
  );
}

async function addPlaylistTrack(targetTrack) {
  const capturedPlaylistEvent = {
    artist: targetTrack.artist.id,
    album: targetTrack.album.id,
    track: targetTrack.track.id,
    label: targetTrack.album.label,
    categories:
      targetTrack.currentTags?.filter((tag) => validTags.includes(tag)) ?? [],
  };
  console.log(util.inspect(JSON.stringify(capturedPlaylistEvent)));
  return await nextup.addPlaylistEvent(JSON.stringify(capturedPlaylistEvent));
}

async function addPlaylistFreeform(targetTrack) {
  const capturedPlaylistEvent = {
    artist: {
      name: targetTrack.artist.name,
    },
    track: { title: targetTrack.track.title },
    album: {
      title: targetTrack.album.title,
      label: targetTrack.album.label,
    },
    categories:
      targetTrack.currentTags?.filter((tag) => validTags.includes(tag)) ?? [],
  };
  return await nextup.addPlaylistEventFreeform(
    JSON.stringify(capturedPlaylistEvent)
  );
}

async function addPlaylistEvent(targetTrack) {
  if (targetTrack.album.id && targetTrack.artist.id && targetTrack.track.id) {
    return await addPlaylistTrack(targetTrack);
  } else {
    return await addPlaylistFreeform(targetTrack);
  }
}

module.exports = {
  getMostRecentPlays,
  addPlaylistEvent,
};
