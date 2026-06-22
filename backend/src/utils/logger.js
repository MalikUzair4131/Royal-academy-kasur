const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, stack }) => {
    return `${timestamp} [${service || 'App'}] ${level.toUpperCase()}: ${message}${stack ? '\n' + stack : ''}`;
  })
);

const createLogger = (service = 'App') => {
  return winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), logFormat)
      }),
      // In production, you'd add file transports here
      // new winston.transports.DailyRotateFile({ filename: 'logs/error-%DATE%.log', level: 'error' }),
    ],
  });
};

module.exports = { createLogger };
