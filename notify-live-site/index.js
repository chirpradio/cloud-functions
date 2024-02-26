const functions = require('@google-cloud/functions-framework');
const axios = require('axios').default;
const urls = process.env.urls.split("|");

functions.cloudEvent("notifyLiveSite", async function () {
  try {
    for (const url of urls) {
      const response = await axios.get(url);
      console.log(url, response.status);
    }
  } catch (error) {
    console.error(error);
  }
});
