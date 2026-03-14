const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');

// Stub env vars needed by modules at import time
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-min-32-chars-long-ok';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_stub';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Read the MongoMemoryServer URI written by globalSetup
// (process.env mutations in globalSetup don't reach worker processes)
const uriFile = path.join(os.tmpdir(), 'jest-mongo-uri.txt');
if (fs.existsSync(uriFile)) {
  process.env.MONGODB_URI = fs.readFileSync(uriFile, 'utf8').trim();
}

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  // Clear all collections once before this suite runs
  const collections = mongoose.connection.collections;
  for (const col of Object.values(collections)) {
    await col.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
