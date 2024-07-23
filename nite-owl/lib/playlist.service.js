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

async function addPlaylistEvent(targetTrack) {
  const capturedPlaylistEvent = {
    artist: {
      name: targetTrack.artist,
    },
    album: {
      title: targetTrack.album,
      label: targetTrack.label,
    },
    track: {
      title: targetTrack.title,
    },
    categories:
      targetTrack.currentTags?.filter((tag) => validTags.includes(tag)) ?? [],
  };
  return await nextup.addPlaylistEvent(JSON.stringify(capturedPlaylistEvent));
}

module.exports = {
  getMostRecentPlays,
  addPlaylistEvent,
};
