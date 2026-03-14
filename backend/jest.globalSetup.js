const fs = require('fs');
const os = require('os');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Persist server instance and URI for teardown + worker access
  global.__MONGO_SERVER__ = mongoServer;
  process.env.MONGODB_URI = uri;

  // Write URI to a temp file so Jest worker processes can read it
  // (process.env mutations in globalSetup don't propagate to workers)
  fs.writeFileSync(path.join(os.tmpdir(), 'jest-mongo-uri.txt'), uri);
};
