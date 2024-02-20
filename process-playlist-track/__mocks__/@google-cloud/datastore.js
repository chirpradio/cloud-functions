const ds = jest.createMockFromModule("@google-cloud/datastore");

class Datastore {
  constructor() {}

  async get() {
    return Promise.resolve([{}]);
  }

  async keyToLegacyUrlSafe() {
    return Promise.resolve("");
  }
}
ds.Datastore = Datastore;

module.exports = ds;
