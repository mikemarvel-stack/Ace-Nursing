const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async () => {
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
  }
  const uriFile = path.join(os.tmpdir(), 'jest-mongo-uri.txt');
  if (fs.existsSync(uriFile)) fs.unlinkSync(uriFile);
};
