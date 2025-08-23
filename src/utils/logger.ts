import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Winston logger instance
const logger = createLogger({
  level: "info",
  format: combine(
    colorize(),          
    logFormat            
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }), 
    new transports.File({ filename: "logs/combined.log" }),              
  ],
});

export default logger;
