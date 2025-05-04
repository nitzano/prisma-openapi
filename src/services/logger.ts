import process from 'node:process';
import winston from 'winston';

// Create Winston logger with console transport only
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL ?? 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.colorize(),
		winston.format.printf(({timestamp, level, message}) => {
			return `${String(timestamp)} [${String(level)}]: ${String(message)}`;
		}),
	),
	transports: [new winston.transports.Console()],
});

export default logger;
