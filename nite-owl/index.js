const functions = require('@google-cloud/functions-framework');
const api = require('./services/api.service')

// Register an HTTP function with the Functions Framework that will be executed
// when you make an HTTP request to the deployed function's endpoint.
functions.http('createPlaylistEvent', async (req, res) => {
  await api.login(req.query.user, req.query.password);
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
    notes: "Nite Owl",
  });
  const result = await api.addFreeformPlaylistTrack(data);
  res.send(JSON.stringify(result));
});