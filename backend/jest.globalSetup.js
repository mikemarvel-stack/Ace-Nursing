const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  // Assign explicitly as a string to avoid env var being set to "undefined"
  process.env.MONGODB_URI = String(uri);
  global.__MONGO_SERVER__ = mongoServer;

  await mongoose.connect(uri);
  const collections = await mongoose.connection.db.collections();
  for (const col of collections) await col.deleteMany({});
  await mongoose.disconnect();
};
