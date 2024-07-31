const util = require("util");
const nextup = require("./nextup.service");
const trackSearch = require("./trackSearch.service");
const playlistService = require("./playlist.service");
const { Logging } = require("@google-cloud/logging");
const logging = new Logging();

const AUTOMATION_USER_ID = process.env.AUTOMATION_USER_ID ?? "5820844800999424";

async function execute(req) {
  await logging.setProjectId();
  await logging.setDetectedResource();
  const log = logging.logSync("createPlaylistEvent");

  if (!req.query.api_key) {
    return { status: 401, body: { msg: "No API Key Included with Request" } };
  }

  if (req.query.title === "_STOP") {
    // StationPlaylist sends a predefined value when stopping the automation,
    // in this case do not perform any actions
    return { status: 400, body: { msg: "StationPlaylist STOP event" } };
  }

  if (req.query.artist === "Live" && req.query.title === "Default User") {
    return { status: 400, body: { msg: "StationPlaylist Break event" } };
  }

  if (!req.query.artist && !req.query["album_artist"]) {
    log.warning(
      log.entry(`No artist included for request ${JSON.stringify(req.query)}`)
    );

    return { status: 400, body: { msg: "No artist included in request" } };
  }

  log.debug(log.entry(util.inspect(req.query)));
  nextup.setApiKey(req.query.api_key);

  try {
    const recentPlays = await playlistService.getMostRecentPlays();
    const djPlay = recentPlays.find(
      (playlistEvent) => playlistEvent.selector.id !== AUTOMATION_USER_ID
    );
    if (djPlay !== undefined && djPlay !== null) {
      log.debug(
        log.entry(`Recent play by DJ: ${util.inspect(djPlay.selector)}`)
      );
      return {
        status: 400,
        body: {
          msg: "Recent play by DJ detected, skipping automation capture",
        },
      };
    }
  } catch (error) {
    if (error.response) {
      log.warning(
        log.entry(
          `Received error: data-${error.response.data}, status-${error.response.status}`
        )
      );
      return {
        status: error.response.status,
        body: { msg: error.response.data },
      };
    } else {
      return { status: 500, body: { msg: error.message } };
    }
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
  return { status: 200, body: result };
}

module.exports = {
  execute,
  handleEvent: async (req, res) => {
    const result = await execute(req);
    res.status(result.status).send(result.body);
  },
};
