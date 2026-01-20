import * as fs from 'fs';
import * as morgan from 'morgan';
import * as path from 'path';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const logDir = path.join(__dirname, '../../../logs');

// Create logs directory recursively if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create subdirectories for info and error logs
const infoLogDir = path.join(logDir, 'info');
const errorLogDir = path.join(logDir, 'error');

if (!fs.existsSync(infoLogDir)) {
  fs.mkdirSync(infoLogDir, { recursive: true });
}

if (!fs.existsSync(errorLogDir)) {
  fs.mkdirSync(errorLogDir, { recursive: true });
}

const { combine, timestamp, printf } = winston.format;

const logFormat = printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`);

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
// Create transports with increased maxListeners to fix MaxListenersExceededWarning
const infoTransport = new DailyRotateFile({
  level: 'info',
  datePattern: 'YYYY-MM-DD',
  dirname: infoLogDir, // log file /logs/info/*.log in save
  filename: `%DATE%.log`,
  maxFiles: 30, // 30 Days saved
  json: false,
  zippedArchive: true,
});

const errorTransport = new winston.transports.DailyRotateFile({
  level: 'error',
  datePattern: 'YYYY-MM-DD',
  dirname: errorLogDir, // log file /logs/error/*.log in save
  filename: `%DATE%.error.log`,
  maxFiles: 30, // 30 Days saved
  handleExceptions: true,
  json: false,
  zippedArchive: true,
});

// Fix MaxListenersExceededWarning by increasing max listeners
if (infoTransport.setMaxListeners) {
  infoTransport.setMaxListeners(20);
}

if (errorTransport.setMaxListeners) {
  errorTransport.setMaxListeners(20);
}

const logger = winston.createLogger({
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [infoTransport, errorTransport],
});

// Always output to console so Docker/Portainer can capture logs
// Error logs go to stderr, info logs go to stdout
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.splat(), winston.format.colorize(), winston.format.simple()),
    // Separate error logs to stderr for better Docker log handling
    stderrLevels: ['error'],
  }),
);

const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

const morganMiddleware = morgan(':method :url :status :response-time ms', {
  stream,
});

export { logger, morganMiddleware, stream };
