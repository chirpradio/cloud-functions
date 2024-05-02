const nextup = require("./nextup.service");
const util = require("util");

const DURATION_TOLERANCE_MS = 30000;
const CLEAN_REGEX = /\W{2}clean\W?/gi;
const FEATURING_REGEX = /\W[([](featuring|ft|feat).+[)\]]$/gi;

function prepareDurationParams(durationSeconds) {
  const durationMs = durationSeconds * 1000;
  let params = {};
  params["track[duration_ms][gte]"] = durationMs - DURATION_TOLERANCE_MS;
  params["track[duration_ms][lte]"] = durationMs + DURATION_TOLERANCE_MS;
  return params;
}

function getSearchTermTransformer(regex) {
  return (searchTerm) => {
    const index = searchTerm.search(regex);
    if (index > 0) {
      return searchTerm.slice(0, index);
    }
    return searchTerm;
  };
}

const cleanTransformer = getSearchTermTransformer(CLEAN_REGEX);
const featuringTransformer = getSearchTermTransformer(FEATURING_REGEX);

function getTrackLocator(durationParams) {
  return async (searchTerm) => {
    console.debug(`Search using term: ${searchTerm}`);
    let params = {
      term: searchTerm,
      type: "track",
      ...durationParams,
    };
    // console.debug(`Query params: ${util.inspect(params)}`);
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
    // const cleanTerm = cleanTransformer(trackTitle);
    // const cleanCandidates = await trackLocator(cleanTerm);
    // if (cleanCandidates.length > 0) {
    //   return cleanCandidates;
    // }

    // const featuringTerm = featuringTransformer(cleanTerm);
    // const featuringCandidates = await trackLocator(featuringTerm);
    // if (featuringCandidates.length > 0) {
    //   return featuringCandidates;
    // }

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
