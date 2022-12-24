const { Datastore } = require("@google-cloud/datastore");
const datastore = new Datastore();
const albumOptions = {
  wrapNumbers: {
    integerTypeCastFunction: datastore.int,
    properties: ["album_id"],
  }
};

const { CloudTasksClient } = require("@google-cloud/tasks");
const client = new CloudTasksClient();
const PROJECT = "chirpradio-hrd";
const LOCATION = "us-central1";
const QUEUE = "update-indexes";
const parent = client.queuePath(PROJECT, LOCATION, QUEUE);

let taskRecord;

async function getTaskRecord() {
  const taskQuery = datastore.createQuery("Task")
                            .filter("queue_name", QUEUE);
  const taskResult = await taskQuery.run(); 
  return taskResult[0][0];
}

async function updateTaskRecord() {
  taskRecord.started = new Date();
  await datastore.save(taskRecord);
}

async function createTask(task) {
  const request = {parent, task};
  const [response] = await client.createTask(request);
  const name = response.name;
  console.log(`Created task ${name}`);
}

async function getAlbumsImportedSinceDate(date) {
  const albumQuery = datastore.createQuery("Album")
                                .filter("import_timestamp", ">=", date)
                                .filter("revoked", false);
  const albumResult = await albumQuery.run(albumOptions);

  return albumResult[0];
}

async function createAlbumTasks(lastRun) {
  const albums = await getAlbumsImportedSinceDate(lastRun);
  for (const album of albums) {
    await createTask({
      appEngineHttpRequest: {          
        appEngineRouting: {
          service: "nextup",
          version: "production"
        },
        httpMethod: "POST",
        relativeUri: `/tasks/reindex/album/${album.album_id.value}`,
      }
    });
  }
}

async function getTagEditsSinceDate(date) {
  const tagEditQuery = datastore.createQuery("TagEdit")
                                .filter("timestamp", ">=", date);
  const result = await tagEditQuery.run();
  return result[0];
}

async function queryBasedOnKindAndKey(kind, key) {
  const result = await datastore.createQuery(kind)
                                .filter("__key__", key)
                                .run(albumOptions);
  return result[0][0];
}

function getRelativeUriForTagEdit(index, album, track) {
  let uri
  
  if(index === "Album") {
    uri = `/tasks/reindex/tags/album/${album.album_id.value}`;
  } else if (index === "Track") {
    uri = `/tasks/reindex/tags/track/${album.album_id.value}-${track.track_num}`;
  }

  return uri;
}

async function createTagEditTasks(lastRun) {
  const tagEdits = await getTagEditsSinceDate(lastRun);
  
  for (const edit of tagEdits) {
    const index = edit.subject.kind; 
    if(index === "Album" || index === "Track") {
      const subject = await queryBasedOnKindAndKey(index, edit.subject); 
      let album, track;           
      if(index === "Album") {
        album = subject;
      } else {
        album = await queryBasedOnKindAndKey("Album", subject.album);
        track = subject;
      }      
      
      const relativeUri = getRelativeUriForTagEdit(index, album, track);
      const { added, removed } = edit;
      const body = Buffer.from(JSON.stringify({
        added,
        removed
      })).toString("base64");
      const task = {
        appEngineHttpRequest: {          
          appEngineRouting: {
            service: "nextup",
            version: "production"
          },
          httpMethod: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          relativeUri,
          body
        }
      };      
      await createTask(task);      
    }
  }
}


exports.updateIndexes = async function() {
  try {
    taskRecord = await getTaskRecord();
    await createAlbumTasks(taskRecord.started);
    await createTagEditTasks(taskRecord.started);
    await updateTaskRecord();
  } catch (err) {
    console.log(err);
  }
};
