const axios = require("axios").default;
const util = require("util");

const DURATION_TOLERANCE = 30000;
const AUTOMATION_USER_ID = "5820844800999424";
const DJ_PLAY_COOLDOWN_MINUTES = 20;

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

async function findTrack(trackTitle, duration, instance) {
  const durationMs = duration * 1000;
  const trackLocator = getSearchExecutor(durationMs, instance);
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
}

function getXMinutesPrevious(x) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - x);
  return date.valueOf();
}

async function getMostRecentPlays(instance) {
  const params = {
    start: getXMinutesPrevious(DJ_PLAY_COOLDOWN_MINUTES),
  };
  const response = await instance.get(`/playlist`, {
    headers: { "Content-Type": "application/json" },
    params: params,
  });
  return response.data;
}

function getSearchExecutor(duration, instance) {
  return async (searchTerm) => {
    console.debug(`Search using term: ${searchTerm}`);
    let params = {};
    params.term = searchTerm;
    params.type = "track";
    console.log(duration);
    if (duration !== undefined && duration !== null && !isNaN(duration)) {
      params["track[duration_ms][gte]"] = duration - DURATION_TOLERANCE;
      params["track[duration_ms][lte]"] = duration + DURATION_TOLERANCE;
    }
    console.debug(`Query params: ${util.inspect(params)}`);
    const response = await instance.get(`/search`, {
      headers: { "Content-Type": "application/json" },
      params: params,
    });
    const candidates = response.data.hits.map((hit) => {
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

  const instance = getAxiosInstance(req.query.api_key);
  const recentPlays = await getMostRecentPlays(instance);
  const djPlay = recentPlays.find(
    (playlistEvent) => playlistEvent.selector.id !== AUTOMATION_USER_ID
  );
  if (djPlay !== undefined && djPlay !== null) {
    console.debug(`Recent play by DJ: ${util.inspect(djPlay.selector)}`);
    res.status(204).send("");
    return;
  }

  const searchResults = await findTrack(
    req.query.title,
    req.query.duration,
    instance
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
  const result = await addFreeformPlaylistTrack(
    JSON.stringify(capturedPlaylistEvent),
    instance
  );
  res.send(result);
};
