const storage = jest.createMockFromModule("@google-cloud/storage");

class File {
  constructor() {}

  exists() {
    return [true];
  }

  async download() {
    const jsonStr = JSON.stringify({
      now_playing: {},
      recently_played: [],
    });
    return [Buffer.from(jsonStr)];
  }

  async save() {}
}

class Bucket {
  constructor() {}

  file() {
    return new File();
  }
}

class Storage {
  constructor() {}

  bucket() {
    return new Bucket();
  }
}
storage.Storage = Storage;

module.exports = storage;
