const { Datastore } = require('@google-cloud/datastore');
const datastore = new Datastore();

const LastFm = require("lastfm-node-client");
const lastFm = new LastFm(process.env.LASTFM_API_KEY);

const { PubSub } = require("@google-cloud/pubsub");
const pubsub = new PubSub();

async function getAlbum(key) {
  const [album] = await datastore.get(key, {
		wrapNumbers: {
			integerTypeCastFunction: datastore.int,
			properties: ["album_id"],
		}
	});
  return album;
}

async function getUrlSafeKey(key) {
  const legacyUrlSafe = await datastore.keyToLegacyUrlSafe(key, "s~");
  return legacyUrlSafe[0];
}

async function getUser(key) {
  const [user] = await datastore.get(key);
  return user;
}

async function getArtist(playlistTrack, album) {
  const artistKey = playlistTrack.artist || album.album_artist;
  const [artist] = await datastore.get(artistKey);
  return artist;
}

async function getTrack(key) {
  const [track] = await datastore.get(key);
  return track;
}

function getImagesFromAlbum(album) {
  if (album.lastfm_retrieval_time && album.lastfm_sm_image_url) {
    return {
      small: album.lastfm_sm_image_url,
      medium: album.lastfm_med_image_url,
      large: album.lastfm_lg_image_url,
    }
  }

  return undefined;
}

function getImageBySize(images, size) {
  if (Array.isArray(images)) {
    const image = images.find((image) => image.size === size);
    if (image) {      
      return image["#text"];
    }
  }
	
  return undefined;
}

async function getImagesFromLastFm(albumTitle, artistName) {
  try {
    const lastFmInfo = await lastFm.albumGetInfo({
      album: albumTitle,
      artist: artistName,
    });

    if (
      lastFmInfo &&
      lastFmInfo.album &&
      lastFmInfo.album.image &&
      lastFmInfo.album.image.length > 0
    ) {      
      const images = lastFmInfo.album.image;
      return {
        small: getImageBySize(images, "small"),
        medium: getImageBySize(images, "medium"),
        large: getImageBySize(images, "large"),
      };
    }
  } catch (error) {    
    return undefined;
  }
} 

async function addImages(images, playlistTrack) {
  playlistTrack.lastfm_url_sm_image = images.small;
  playlistTrack.lastfm_url_med_image = images.medium;
  playlistTrack.lastfm_url_large_image = images.large;
  playlistTrack.lastfm_urls_processed = true;  
  await datastore.save(playlistTrack);
}

async function addImagesToFreeformTrack(playlistTrack) {
  const images = await getImagesFromLastFm(playlistTrack.freeform_album_title, playlistTrack.freeform_artist_name);  
  if (images) {
    await addImages(images, playlistTrack);
  }
}

async function addImagesToLibraryTrack(playlistTrack, album, artist) {
  let images = getImagesFromAlbum(album);
  if (!images) {
    images = await getImagesFromLastFm(album.title, artist.name); 
  }
  if (images) {
    await addImages(images, playlistTrack);
  }
}

async function publishMessage(message) {  
  const data = Buffer.from(message);  
  await pubsub.topic("playlist-track-processed").publishMessage({ data });
}

module.exports = async function(message) {
  const data = JSON.parse(Buffer.from(message.data, "base64").toString());
  if (data.action === "added" || data.action === "updated") {  
    const [playlistTrack] = await datastore.get(data.track.__key);    
    
    try {        
      if (typeof playlistTrack.freeform_track_title === "string") {
        await addImagesToFreeformTrack(playlistTrack);
      } else {
        const album = await getAlbum(playlistTrack.album);
        const artist = await getArtist(playlistTrack, album);
        const track = await getTrack(playlistTrack.track);
        await addImagesToLibraryTrack(playlistTrack, album, artist);
        Object.assign(playlistTrack, {
          album,
          artist,
          track,
        });
      }

      playlistTrack.id = await getUrlSafeKey(playlistTrack[datastore.KEY]);
      playlistTrack.selector = await getUser(playlistTrack.selector);
    } catch (error) {
      console.error(error);
    } finally {
      publishMessage(JSON.stringify({
        action: data.action,
        track: playlistTrack,
      }));
    }
  }    
}