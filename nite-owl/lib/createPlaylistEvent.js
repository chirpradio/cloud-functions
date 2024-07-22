const util = require("util");
const nextup = require("./nextup.service");
const trackSearch = require("./trackSearch.service");
const playlistService = require("./playlist.service");
// const logging = require("./logging").getLogger("createPlaylistEvent");
const { Logging } = require("@google-cloud/logging");
const logging = new Logging();

const AUTOMATION_USER_ID = process.env.AUTOMATION_USER_ID ?? "5820844800999424";

// function getXMinutesPrevious(x) {
//   const date = new Date();
//   date.setMinutes(date.getMinutes() - x);
//   return date.valueOf();
// }

// async function getMostRecentPlays() {
//   const params = {
//     start: getXMinutesPrevious(DJ_PLAY_COOLDOWN_MINUTES),
//   };
//   return nextup.getPlaylist(params);
// }

module.exports = async function (req, res) {
  await logging.setProjectId();
  await logging.setDetectedResource();
  const log = logging.logSync("createPlaylistEvent");

  if (!req.query.api_key) {
    res.status(401).send("");
    return;
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

  if (!req.query.artist && !req.query["album_artist"]) {
    res.status(204).send("");
    log.warning(
      log.entry(`No artist included for request ${JSON.stringify(req.query)}`)
    );
    return;
  }

  log.debug(log.entry(util.inspect(req.query)));
  nextup.setApiKey(req.query.api_key);

  const recentPlays = await playlistService.getMostRecentPlays();
  // const recentPlays = await getMostRecentPlays();
  const djPlay = recentPlays.find(
    (playlistEvent) => playlistEvent.selector.id !== AUTOMATION_USER_ID
  );
  if (djPlay !== undefined && djPlay !== null) {
    log.debug(log.entry(`Recent play by DJ: ${util.inspect(djPlay.selector)}`));
    res.status(204).send("");
    return;
  }

  const searchResults = await trackSearch.find(
    req.query.title,
    req.query.duration
  );

  log.debug(
    log.entry(
      `Artist albums: ${util.inspect(searchResults.map((result) => `${result.trackNumber} ${result.artist} - ${result.title} (${result.year})`))}`
    )
  );
  const targetArtist = req.query.artist
    ? req.query.artist
    : req.query["album_artist"];

  log.debug(log.entry(`Target artist: ${targetArtist}`));
  const targetTrack = searchResults.find(
    (result) =>
      result.artist.toLowerCase() === targetArtist.toLowerCase() ||
      result.album.toLowerCase() === req.query.album.toLowerCase()
  ) ?? {
    artist: req.query.artist,
    album: req.query.album,
    label: req.query.label,
    title: req.query.title,
  };

  const result = await playlistService.addPlaylistEvent(targetTrack);

  res.send(result);
};
