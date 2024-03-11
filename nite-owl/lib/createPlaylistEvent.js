const axios = require("axios").default;
const util = require("util");

const instance = axios.create({
  baseURL: process.env.API_URL,
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

async function addFreeformPlaylistTrack(data, api_key) {
  const response = await instance.post(`/playlist/freeform`, data, {
    headers: { "Content-Type": "application/json" },
    params: {
      api_key: api_key,
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
  const data = JSON.stringify({
    artist: {
      name: req.query.artist,
    },
    album: {
      title: req.query.album,
      label: req.query.label,
    },
    track: {
      title: req.query.title,
    },
    categories: [],
    notes: "Music Mix",
  });
  const result = await addFreeformPlaylistTrack(data, req.query.api_key);
  res.send(JSON.stringify(result));
};
