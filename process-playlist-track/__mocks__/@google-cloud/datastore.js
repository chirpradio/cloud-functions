const ds = jest.createMockFromModule("@google-cloud/datastore");

class Datastore {
  constructor() {

  }

  async get(key, args) {
    return Promise.resolve([{}]);
  }

  async keyToLegacyUrlSafe(key, prefix) {
    return Promise.resolve("");
  }
}
ds.Datastore = Datastore;

module.exports = ds;
