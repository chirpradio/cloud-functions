const axios = require("axios").default;
const { log } = require("console");
const util = require("util");

// const instance = axios.create({
//   baseURL: process.env.API_URL,
// });

// instance.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     console.log(util.inspect(error));
//     console.log(error.response.data);
//     return Promise.reject(error);
//   }
// );

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

async function findArtist(artist, instance) {
  const response = await instance.get(`/search`, {
    headers: { "Content-Type": "application/json" },
    params: {
      term: artist,
      type: "artist",
    },
  });
  return response.data;
}

async function findTrack(track, instance) {
  const response = await instance.get(`/search`, {
    headers: { "Content-Type": "application/json" },
    params: {
      term: track,
      type: "track",
    },
  });
  return response.data;
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

  const instance = getAxiosInstance(req.query.api_key);

  const track = await findTrack(req.query.title, instance);
  const artistAlbums = track.hits
    .filter((hit) => {
      return hit._source.album.album_artist?.name === req.query.artist;
    })
    .map((hit) => hit._source.album);
  const targetAlbum =
    artistAlbums.find((album) => album.title === req.query.album) ??
    artistAlbums[0];

  const capturedPlaylistEvent = {
    artist: {
      name: req.query.artist,
    },
    album: {
      title: targetAlbum.title,
      label: targetAlbum.label,
    },
    track: {
      title: req.query.title,
    },
    categories: [],
    notes: "Music Mix",
  };
  const result = await addFreeformPlaylistTrack(
    JSON.stringify(capturedPlaylistEvent),
    instance
  );
  res.send(result);
};
