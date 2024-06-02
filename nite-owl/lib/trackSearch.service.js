const nextup = require("./nextup.service");
const util = require("util");
const { Logging } = require("@google-cloud/logging");
const logging = new Logging();
const log = logging.logSync("trackSearch");

const DURATION_TOLERANCE_MS = 30000;

function prepareDurationParams(durationSeconds) {
  const durationMs = durationSeconds * 1000;
  let params = {};
  params["track[duration_ms][gte]"] = durationMs - DURATION_TOLERANCE_MS;
  params["track[duration_ms][lte]"] = durationMs + DURATION_TOLERANCE_MS;
  log.debug(log.entry(`Duration params: ${util.inspect(params)}`));
  return params;
}

function getTrackLocator(durationParams) {
  return async (searchTerm) => {
    log.debug(log.entry(`Search using term: ${searchTerm}`));
    let params = {
      term: searchTerm,
      type: "track",
      ...durationParams,
    };
    const searchResults = await nextup.search(params);
    const candidates = searchResults.hits.map((hit) => {
      return {
        artist:
          hit._source.track_artist?.name ??
          hit._source.album.album_artist?.name,
        album: hit._source.album.title,
        albumYear: hit._source.album.year,
        label: hit._source.album.label,
        currentTags: hit._source.album.album_artist?.current_tags,
        title: hit._source.title,
        year: hit._source.album.year,
        trackNumber: hit._source.track_num,
      };
    });
    return candidates;
  };
}

module.exports = {
  async find(trackTitle, durationSeconds) {
    const durationParams = prepareDurationParams(durationSeconds);
    const trackLocator = getTrackLocator(durationParams);
    const rawCandidates = await trackLocator(trackTitle);
    if (rawCandidates.length > 0) {
      return rawCandidates;
    }

    const titleTerms = trackTitle.split(" ");
    for (let i = 1; i < titleTerms.length; i++) {
      const offset = 0 - i;
      const currentTerms = titleTerms.slice(0, offset);
      const currentSearchTerm = currentTerms.join(" ");
      const currentCandidates = await trackLocator(currentSearchTerm);
      if (currentCandidates.length > 0) {
        return currentCandidates;
      }
    }

    return [];
  },
};
