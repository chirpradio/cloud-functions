const axios = require("axios").default;
const util = require("util");

async function addFreeformPlaylistTrack(data, instance) {
  const response = await instance.post(`/playlist/freeform`, data, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

function getAxiosInstance(apiKey) {
  const instance = axios.create({
    baseURL: process.env.API_URL,
    params: {
      api_key: apiKey,
    },
  });
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      console.log(util.inspect(error));
      console.log(error.response.data);
      return Promise.reject(error);
    }
  );
  return instance;
}

async function findTrack(trackTitle, instance) {
  const rawCandidates = await executeSearch(trackTitle, instance);
  if (rawCandidates.length > 0) {
    return rawCandidates;
  }
  let searchTerm = trackTitle;
  const cleanRegex = /\W{2}clean\W?/gi;
  const cleanIndex = trackTitle.search(cleanRegex);
  if (cleanIndex > 0) {
    searchTerm = trackTitle.slice(0, cleanIndex);
    const cleanCandidates = await executeSearch(searchTerm, instance);
    if (cleanCandidates.length > 0) {
      return cleanCandidates;
    }
  }
  const featuringRegex = /\W[([](featuring|ft|feat).+[)\]]$/gi;
  const featuringIndex = searchTerm.search(featuringRegex);
  if (featuringIndex > 0) {
    searchTerm = searchTerm.slice(0, featuringIndex);
    const featuringCandidates = await executeSearch(searchTerm, instance);
    if (featuringCandidates.length > 0) {
      return featuringCandidates;
    }
  }
  const titleTerms = searchTerm.split(" ");
  for (let i = 1; i < titleTerms.length; i++) {
    const offset = 0 - i;
    const currentTerms = titleTerms.slice(0, offset);
    const currentSearchTerm = currentTerms.join(" ");
    const currentCandidates = await executeSearch(currentSearchTerm, instance);
    if (currentCandidates.length > 0) {
      return currentCandidates;
    }
  }

  return [];
}

async function executeSearch(searchTerm, instance) {
  console.log(`Search using term: ${searchTerm}`);
  const response = await instance.get(`/search`, {
    headers: { "Content-Type": "application/json" },
    params: {
      term: searchTerm,
      type: "track",
    },
  });
  const candidates = response.data.hits.map((hit) => {
    return {
      artist:
        hit._source.track_artist?.name ?? hit._source.album.album_artist?.name,
      album: hit._source.album.title,
      albumYear: hit._source.album.year,
      label: hit._source.album.label,
      currentTags: hit._source.album.album_artist?.current_tags,
      title: hit._source.title,
      trackNumber: hit._source.track_num,
    };
  });
  return candidates;
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

  const instance = getAxiosInstance(req.query.api_key);

  const searchResults = await findTrack(req.query.title, instance);
  console.log(`Artist albums: ${util.inspect(searchResults)}`);
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
  const result = await addFreeformPlaylistTrack(
    JSON.stringify(capturedPlaylistEvent),
    instance
  );
  res.send(result);
};
