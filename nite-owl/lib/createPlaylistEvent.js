const util = require("util");
const nextup = require("./nextup.service");
const trackSearch = require("./trackSearch.service");
const playlistService = require("./playlist.service");
const { Logging } = require("@google-cloud/logging");
const logging = new Logging();

const AUTOMATION_USER_ID = process.env.AUTOMATION_USER_ID ?? "5820844800999424";

function response(status) {
  return (msg) => {
    return { status, body: { msg } };
  };
}

const unauthorized = response(401);
const badRequest = response(400);
const internalServerError = response(500);

function validationResult(isValid) {
  return (response) => {
    return { isValid, response };
  };
}

const invalid = validationResult(false);
const valid = validationResult(true);

function validateRequest(req) {
  if (!req.query.api_key) {
    return invalid(unauthorized("Cannot authenticate request"));
  }

  if (req.query.title === "_STOP") {
    return invalid(badRequest("StationPlaylist STOP event"));
  }

  if (req.query.artist === "Live" && req.query.title === "Default User") {
    return invalid(badRequest("StationPlaylist Break event"));
  }

  if (!req.query.artist && !req.query.album_artist) {
    return invalid(badRequest("No artist included in request"));
  }

  if (!req.query.duration) {
    return invalid(badRequest("No duration included in request"));
  }
  return valid();
}

async function execute(req) {
  await logging.setProjectId();
  await logging.setDetectedResource();
  const log = logging.logSync("createPlaylistEvent");

  const validationResult = validateRequest(req);
  if (!validationResult.isValid) {
    // Ensure API Key does not appear in logged query params
    Object.defineProperty(req.query, "api_key", {
      enumerable: false,
    });
    log.warning(log.entry(util.inspect(req.query)));
    return validationResult.response;
  }

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
      return badRequest("Recent play by DJ detected, skipping capture");
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
      return internalServerError(error.message);
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
