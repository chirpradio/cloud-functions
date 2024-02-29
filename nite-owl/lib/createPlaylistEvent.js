const axios = require("axios").default;
const util = require("util");

const instance = axios.create({
  baseURL: process.env.API_URL,
});

const userTokens = [];

function setAuthorizationHeader(token) {
  instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

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

async function login(email, password) {
  if (!userTokens[email]) {
    const response = await instance.post("/token", {
      email,
      password,
    });

    if (response.data.token) {
      setAuthorizationHeader(response.data.token);
    }
    userTokens[email] = response.data;
  }
  return userTokens[email];
}

async function addFreeformPlaylistTrack(data) {
  const response = await instance.post("/playlist/freeform", data, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

module.exports = async function (req, res) {
  if (req.query.title === "_STOP") {
    // StationPlaylist sends a predefined value when stopping the automation,
    // in this case do not perform any actions
    res.status(204).send("");
    return;
  }
  await login(req.query.user, req.query.password);
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
  const result = await addFreeformPlaylistTrack(data);
  res.send(JSON.stringify(result));
};
