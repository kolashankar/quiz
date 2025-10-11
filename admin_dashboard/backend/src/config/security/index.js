const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const environment = require('../environment');

class SecurityConfig {
  constructor() {
    this.environment = environment;
  }

  // Rate limiting configuration
  createRateLimiter(windowMs, max, message) {
    return rateLimit({
      windowMs: windowMs || this.environment.RATE_LIMIT_WINDOW,
      max: max || this.environment.RATE_LIMIT_MAX,
      message: message || {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 60000) // minutes
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: message || 'Rate limit exceeded',
          retryAfter: Math.ceil(windowMs / 60000)
        });
      }
    });
  }

  // Different rate limiters for different endpoints
  getRateLimiters() {
    return {
      // General API rate limiter
      general: this.createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        100, // requests
        'Too many requests, please try again later'
      ),

      // Authentication rate limiter (stricter)
      auth: this.createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        10, // requests
        'Too many authentication attempts, please try again later'
      ),

      // File upload rate limiter
      upload: this.createRateLimiter(
        60 * 60 * 1000, // 1 hour
        20, // requests
        'Too many upload attempts, please try again later'
      ),

      // AI endpoints rate limiter
      ai: this.createRateLimiter(
        60 * 60 * 1000, // 1 hour
        50, // requests
        'AI service rate limit exceeded, please try again later'
      )
    };
  }

  // Helmet configuration
  getHelmetConfig() {
    return helmet({
      contentSecurityPolicy: this.environment.isDevelopment() ? false : {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  // CORS configuration
  getCorsConfig() {
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (this.environment.ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count']
    };
  }

  // Input sanitization rules
  getSanitizationRules() {
    return {
      // Remove HTML tags
      removeHtml: (input) => {
        return input.replace(/<[^>]*>/g, '');
      },

      // Remove SQL injection patterns
      removeSqlPatterns: (input) => {
        const sqlPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
          /(;|--|\/\*|\*\/|xp_)/gi
        ];
        
        let sanitized = input;
        sqlPatterns.forEach(pattern => {
          sanitized = sanitized.replace(pattern, '');
        });
        return sanitized;
      },

      // Remove NoSQL injection patterns
      removeNoSqlPatterns: (input) => {
        if (typeof input === 'object') {
          const dangerous = ['$where', '$ne', '$gt', '$lt', '$regex', '$exists'];
          const cleaned = { ...input };
          dangerous.forEach(key => {
            if (cleaned[key]) delete cleaned[key];
          });
          return cleaned;
        }
        return input;
      },

      // Validate email format
      validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },

      // Validate MongoDB ObjectId
      validateObjectId: (id) => {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        return objectIdRegex.test(id);
      }
    };
  }

  // Security headers
  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  // File upload security
  getFileUploadSecurity() {
    return {
      limits: {
        fileSize: parseInt(this.environment.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: 5,
        fields: 10
      },
      fileFilter: (req, file, cb) => {
        // Check file type
        if (this.environment.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
      // Scan for malicious content
      scanFile: (filePath) => {
        // Implement virus scanning if needed
        return Promise.resolve(true);
      }
    };
  }

  // Request validation
  validateRequest(req) {
    const errors = [];

    // Check for common attack patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /exec\(/i
    ];

    const checkValue = (value, path = '') => {
      if (typeof value === 'string') {
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(value)) {
            errors.push(`Suspicious content detected in ${path}`);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(key => {
          checkValue(value[key], path ? `${path}.${key}` : key);
        });
      }
    };

    // Check request body
    if (req.body) {
      checkValue(req.body, 'body');
    }

    // Check query parameters
    if (req.query) {
      checkValue(req.query, 'query');
    }

    // Check params
    if (req.params) {
      checkValue(req.params, 'params');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new SecurityConfig();