const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'logger.txt');

function writeToFile(logMessage) {
  fs.appendFile(logFilePath, logMessage + '\n', (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
}

// Create a custom morgan token for timestamp
morgan.token('timestamp', () => {
  return new Date().toISOString();
});

const customFormat = ':timestamp - :method :url :status :response-time ms';

const morganLogger = morgan(customFormat);

const logger = {
  info: (message, data = '') => {
    const logMessage = `[INFO] ${new Date().toISOString()} - ${message} ${data}`;
    console.log(logMessage);
    writeToFile(logMessage);   
  },
  error: (message, error = '') => {
    const logMessage = `[ERROR] ${new Date().toISOString()} - ${message} ${error}`;
    console.error(logMessage);
    writeToFile(logMessage);
  },
  warn: (message, data = '') => {
    const logMessage = `[WARN] ${new Date().toISOString()} - ${message} ${data}`;
    console.warn(logMessage);
    writeToFile(logMessage);
  },
  debug: (message, data = '') => {
    if (process.env.DEBUG) {
      const logMessage = `[DEBUG] ${new Date().toISOString()} - ${message} ${data}`;
      console.log(logMessage);
      writeToFile(logMessage);
    }
  },
  consoleOnly: (message, data = '') => {
    const logMessage = `[INFO] ${new Date().toISOString()} - ${message} ${data}`;
    console.log(logMessage);
  },
};

module.exports = { morganLogger, logger };
