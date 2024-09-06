const axios = require("axios").default;
const util = require("util");
// const log = require("./logging").getLogger("nextUp")();
const { Logging } = require("@google-cloud/logging");
const logging = new Logging();
const log = logging.logSync("trackSearch");

const instance = axios.create({
  baseURL: process.env.API_URL,
  headers: { "Content-Type": "application/json" },
});
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    log.error(log.entry(util.inspect(error)));
    log.error(log.entry(error.response.data));
    return Promise.reject(error);
  }
);

async function getAndHandleError(getter) {
  const response = await getter;
  return response.data;
}

function setApiKey(apiKey) {
  instance.interceptors.request.use((config) => {
    config.params = config.params || {};
    config.params["api_key"] = apiKey;
    return config;
  });
}

module.exports = {
  setApiKey,
  async search(params) {
    const getter = instance.get("/search", { params });
    return getAndHandleError(getter);
  },
  async getPlaylist(params) {
    const getter = instance.get("/playlist", { params });
    return getAndHandleError(getter);
  },
  async addPlaylistEventFreeform(data) {
    const response = await instance.post(`/playlist/freeform`, data);
    return response.data;
  },
  async addPlaylistEvent(data) {
    const response = await instance.post(`/playlist/track`, data);
    return response.data;
  },
};
