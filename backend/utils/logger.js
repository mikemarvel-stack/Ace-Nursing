const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logDir = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.printf(({ timestamp, level, message, stack, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level}] ${message}${stack ? `\n${stack}` : ''}${metaString ? ` ${metaString}` : ''}`;
    }),
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize({ all: true }), format.simple()),
    }),
    // Skip file transports in test env to avoid open handle warnings
    ...(process.env.NODE_ENV !== 'test' ? [
      new DailyRotateFile({
        filename: path.join(logDir, 'app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        zippedArchive: true,
        level: 'info',
      }),
      new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
        zippedArchive: true,
        level: 'error',
      }),
    ] : []),
  ],
  exitOnError: false,
});

/**
 * Wraps a logger message with a request id (if present).
 */
function childLogger(req) {
  if (!req || !req.id) return logger;
  return logger.child({ requestId: req.id });
}

module.exports = { logger, childLogger };
