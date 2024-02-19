const pubsub = jest.createMockFromModule("@google-cloud/pubsub");

class Topic {
  constructor() {
    
  }

  publishMessage() {
    
  }
}

class PubSub {
  constructor() {

  }

  topic() {
    return new Topic();
  }
}
pubsub.PubSub = PubSub;

module.exports = pubsub;
