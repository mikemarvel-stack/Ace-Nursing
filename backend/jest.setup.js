const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {
  // Ensure tests don't accidentally hit a real MongoDB.
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/acenursing-test';

  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  await mongoose.connect(process.env.MONGODB_URI);

  // Clear DB between tests
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }

  // Ensure we stop mongo after all tests
  const teardown = async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  };

  // jest global teardown is not available by default without a separate file,
  // but we can hook into process exit to be safe.
  process.on('exit', teardown);
};
