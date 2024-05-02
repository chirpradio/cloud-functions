const nextup = require("./nextup.service");
const util = require("util");

const DURATION_TOLERANCE_MS = 30000;
const CLEAN_REGEX = /\W{2}clean\W?/gi;

function prepareDurationParams(durationSeconds) {
  const durationMs = durationSeconds * 1000;
  let params = {};
  params["track[duration_ms][gte]"] = durationMs - DURATION_TOLERANCE_MS;
  params["track[duration_ms][lte]"] = durationMs + DURATION_TOLERANCE_MS;
  return params;
}

// function getSearchTermModifier(regex) {
//   (searchTerm) => {
//     const index = searchTerm.search(regex);
//     if (index > 0) {
//       return searchTerm.slice(0, index);
//     }
//     return searchTerm;
//   };
// }

// const cleanModifier = getSearchTermModifier(CLEAN_REGEX);

function getTrackLocator(durationParams) {
  return async (searchTerm) => {
    console.debug(`Search using term: ${searchTerm}`);
    let params = {
      term: searchTerm,
      type: "track",
      ...durationParams,
    };
    console.debug(`Query params: ${util.inspect(params)}`);
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
    let searchTerm = trackTitle;
    const cleanRegex = /\W{2}clean\W?/gi;
    const cleanIndex = trackTitle.search(cleanRegex);
    if (cleanIndex > 0) {
      searchTerm = trackTitle.slice(0, cleanIndex);
      const cleanCandidates = await trackLocator(searchTerm);
      if (cleanCandidates.length > 0) {
        return cleanCandidates;
      }
    }
    const featuringRegex = /\W[([](featuring|ft|feat).+[)\]]$/gi;
    const featuringIndex = searchTerm.search(featuringRegex);
    if (featuringIndex > 0) {
      searchTerm = searchTerm.slice(0, featuringIndex);
      const featuringCandidates = await trackLocator(searchTerm);
      if (featuringCandidates.length > 0) {
        return featuringCandidates;
      }
    }
    const titleTerms = searchTerm.split(" ");
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
