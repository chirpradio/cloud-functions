const { DateTime } = require("luxon");

function isLocal(track) {
  if (!Array.isArray(track.categories)) {
    return false;
  }

  return (
    track.categories.includes("local_classic") ||
    track.categories.includes("local_current")
  );
}

/*
  Differences from DJDB api/current_playlist output
  - Only includes milliseconds up to three decimal points instead of six
*/
module.exports = function formatTrack(track) {
  const gmtDate = DateTime.fromISO(track.established).toUTC(0);
  const localDate = gmtDate.setZone("America/Chicago");
  const expireDate = localDate.plus({ days: 6 * 31 }); // matches DJDB
  /*
    matches DJDB
    uses local date/time values but is used to generate a Unix timestamp
    as if that date/time were GMT
  */
  const legacyDate = DateTime.utc(
    localDate.year,
    localDate.month,
    localDate.day,
    localDate.hour,
    localDate.minute,
    localDate.second,
    localDate.millisecond,
  );

  return {
    id: track.id,
    dj: track.selector.dj_name,
    artist: track.artist?.name || track.freeform_artist_name,
    track: track.track?.title || track.freeform_track_title,
    release: track.album?.title || track.freeform_album_title,
    label: track.album?.label || track.freeform_label,
    notes: track.notes || "",
    artist_is_local: isLocal(track),
    played_at_gmt: gmtDate.toISO({ includeOffset: false }),
    played_at_gmt_ts: Math.floor(gmtDate.toSeconds()),
    played_at_local: localDate.toISO(),
    played_at_local_expire: expireDate.toISO(),
    played_at_local_ts: Math.floor(legacyDate.toSeconds()),
    lastfm_urls: {
      med_image: track.lastfm_url_med_image,
      sm_image: track.lastfm_url_sm_image,
      _processed: track.lastfm_urls_processed,
      large_image: track.lastfm_url_large_image,
    },
  };
};
