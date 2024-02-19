const axios = require("axios").default;
const util = require("util");

const instance = axios.create({
  baseURL: process.env.API_URL
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

async function getAndHandleError(getter) {
  const response = await getter;
  return response.data;
}

module.exports = {
  async login(email, password) {
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
  },

  setAuthorizationHeader,

  async search(params) {
    const getter = instance.get("/search", {
      params,
    });
    return await getAndHandleError(getter);
  },

  async addFreeformPlaylistTrack(data) {
    const response = await instance.post("/playlist/freeform", data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },
};
