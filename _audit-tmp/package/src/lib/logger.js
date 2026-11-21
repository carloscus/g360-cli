import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Niveles de log disponibles
 * @enum {string}
 */
const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Formato personalizado para logs
 * @param {Object} info - Información del log
 * @returns {string} Log formateado
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

/**
 * Logger configurado para G360-CLI
 * @type {winston.Logger}
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Console transport para desarrollo
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    
    // File transport para logs persistentes
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/g360-cli.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 3
    }),
    
    // Error file transport
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ]
});

/**
 * Crea un logger hijo con contexto específico
 * @param {string} context - Contexto del logger
 * @returns {winston.Logger} Logger hijo con contexto
 */
export function createChildLogger(context) {
  return logger.child({ context });
}

/**
 * Logger para comandos CLI
 */
export const commandLogger = createChildLogger('command');

/**
 * Logger para operaciones de archivos
 */
export const fileLogger = createChildLogger('file');

/**
 * Logger para validaciones
 */
export const validationLogger = createChildLogger('validation');

/**
 * Logger para auditoría
 */
export const auditLogger = createChildLogger('audit');

export default logger;