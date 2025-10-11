const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const environment = require('../environment');

class LoggingConfig {
  constructor() {
    this.logLevel = environment.LOG_LEVEL;
    this.logFormat = environment.LOG_FORMAT;
    this.logFile = environment.LOG_FILE;
    this.ensureLogDirectory();
  }

  // Ensure log directory exists
  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // Custom log levels
  levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  };

  // Log colors for console output
  colors = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    http: '\x1b[35m',  // Magenta
    debug: '\x1b[32m', // Green
    reset: '\x1b[0m'
  };

  // Format log message
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    
    return {
      timestamp,
      level,
      message,
      meta: metaStr,
      pid: process.pid,
      hostname: require('os').hostname()
    };
  }

  // Console logger with colors
  logToConsole(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.logLevel]) {
      return;
    }

    const color = this.colors[level] || this.colors.reset;
    const formatted = this.formatMessage(level, message, meta);
    
    console.log(
      `${color}[${formatted.timestamp}] ${level.toUpperCase()}: ${message}${this.colors.reset}`,
      meta && Object.keys(meta).length > 0 ? meta : ''
    );
  }

  // File logger
  logToFile(level, message, meta = {}) {
    const formatted = this.formatMessage(level, message, meta);
    const logLine = JSON.stringify(formatted) + '\n';
    
    fs.appendFileSync(this.logFile, logLine, 'utf8');
  }

  // Main log function
  log(level, message, meta = {}) {
    this.logToConsole(level, message, meta);
    
    if (environment.isProduction()) {
      this.logToFile(level, message, meta);
    }
  }

  // Convenience methods
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  http(message, meta = {}) {
    this.log('http', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Morgan HTTP logger middleware
  getHttpLogger() {
    // Custom token for response time in milliseconds
    morgan.token('response-time-ms', (req, res) => {
      const responseTime = res.getHeader('X-Response-Time');
      return responseTime ? `${responseTime}ms` : '-';
    });

    // Custom format
    const customFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms';

    return morgan(customFormat, {
      stream: {
        write: (message) => {
          this.http(message.trim());
        }
      },
      skip: (req, res) => {
        // Skip logging for health checks in production
        return environment.isProduction() && req.url === '/health';
      }
    });
  }

  // Request logging middleware
  logRequest() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Log request
      this.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });

      // Log response
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - startTime;
        
        if (res.statusCode >= 400) {
          logger.error(`${req.method} ${req.originalUrl} - ${res.statusCode}`, {
            duration,
            statusCode: res.statusCode,
            userId: req.user?.id
          });
        } else {
          logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode}`, {
            duration,
            statusCode: res.statusCode,
            userId: req.user?.id
          });
        }

        originalSend.call(this, data);
      };

      next();
    };
  }

  // Error logging middleware
  logError() {
    return (err, req, res, next) => {
      this.error(err.message, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
        body: req.body
      });

      next(err);
    };
  }

  // Database query logger
  logDatabaseQuery(query, duration, error = null) {
    if (error) {
      this.error('Database query failed', {
        query: query.slice(0, 500), // Limit query length
        duration,
        error: error.message
      });
    } else {
      this.debug('Database query executed', {
        query: query.slice(0, 200),
        duration
      });
    }
  }

  // Performance monitoring
  logPerformance(operation, duration, metadata = {}) {
    if (duration > 1000) { // Log slow operations (>1s)
      this.warn(`Slow operation detected: ${operation}`, {
        duration,
        ...metadata
      });
    } else {
      this.debug(`Operation completed: ${operation}`, {
        duration,
        ...metadata
      });
    }
  }

  // Security event logging
  logSecurityEvent(event, details = {}) {
    this.warn(`Security event: ${event}`, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

const logger = new LoggingConfig();
module.exports = logger;