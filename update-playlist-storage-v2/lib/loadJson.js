async function loadJson(file) {
  const [exists] = await file.exists();
  if (exists === true) {
    const [contents] = await file.download();
    return JSON.parse(Buffer.from(contents).toString());
  } else {
    return {
      now_playing: {},
      recently_played: [],
    };
  }
}

module.exports = {
  loadJson,
};
