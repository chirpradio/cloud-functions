const util = require("util");
const nextup = require("./nextup.service");
const trackSearch = require("./trackSearch.service");

const AUTOMATION_USER_ID = "5820844800999424";
const DJ_PLAY_COOLDOWN_MINUTES = 20;

function getXMinutesPrevious(x) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - x);
  return date.valueOf();
}

async function getMostRecentPlays() {
  const params = {
    start: getXMinutesPrevious(DJ_PLAY_COOLDOWN_MINUTES),
  };
  return nextup.getPlaylist(params);
}

module.exports = async function (req, res) {
  if (!req.query.api_key) {
    res.status(401).send("");
  }
  if (req.query.title === "_STOP") {
    // StationPlaylist sends a predefined value when stopping the automation,
    // in this case do not perform any actions
    res.status(204).send("");
    return;
  }
  if (req.query.artist === "Live" && req.query.title === "Default User") {
    res.status(204).send("");
    return;
  }
  if (req.query.artist === null || req.query.artist === undefined) {
    res.status(204).send("");
    return;
  }

  console.debug(util.inspect(req.query));
  nextup.setApiKey(req.query.api_key);

  const recentPlays = await getMostRecentPlays();
  const djPlay = recentPlays.find(
    (playlistEvent) => playlistEvent.selector.id !== AUTOMATION_USER_ID
  );
  if (djPlay !== undefined && djPlay !== null) {
    console.debug(`Recent play by DJ: ${util.inspect(djPlay.selector)}`);
    res.status(204).send("");
    return;
  }

  const searchResults = await trackSearch.find(
    req.query.title,
    req.query.duration
  );

  console.debug(`Artist albums: ${util.inspect(searchResults)}`);
  const targetTrack = searchResults.find(
    (result) =>
      result.artist.toLowerCase() === req.query.artist.toLowerCase() ||
      result.album.toLowerCase() === req.query.album.toLowerCase()
  ) ?? {
    artist: req.query.artist,
    album: req.query.album,
    label: req.query.label,
    title: req.query.title,
  };

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
    categories: targetTrack.currentTags ?? [],
    notes: "Music Mix",
  };
  const result = await nextup.addPlaylistEvent(
    JSON.stringify(capturedPlaylistEvent)
  );
  res.send(result);
};
