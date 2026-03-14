const onFinished = require('on-finished');
const { childLogger } = require('../utils/logger');

function requestLogger(req, res, next) {
  const log = childLogger(req);
  const startTime = process.hrtime();

  log.info('Incoming request: %s %s', req.method, req.originalUrl);

  onFinished(res, () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationMs = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2);
    log.info(
      'Request completed: %s %s %s %s %sms',
      req.method,
      req.originalUrl,
      res.statusCode,
      res.statusMessage || '',
      durationMs,
    );
  });

  next();
}

module.exports = requestLogger;
