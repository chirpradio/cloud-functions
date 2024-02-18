function updateNowPlaying(track, previousPlaylist) {
  return {
    now_playing: track,
    recently_played: [
      previousPlaylist.now_playing,
      ...previousPlaylist.recently_played.slice(0, 4),
    ],
  };
}

module.exports = {
  updateNowPlaying,
};
