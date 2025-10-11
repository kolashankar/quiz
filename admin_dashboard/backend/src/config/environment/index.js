require('dotenv').config();

const environment = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 8003,
  HOST: process.env.HOST || '0.0.0.0',

  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/quiz_admin_db',

  // Authentication Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'quiz_admin_jwt_secret_key_2024_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,

  // CORS Configuration
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://localhost:3001'],

  // File Upload Configuration
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10mb',
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  ALLOWED_FILE_TYPES: ['text/csv', 'application/vnd.ms-excel'],

  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 1000,

  // AI Configuration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gemini-pro',
  AI_TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
  AI_MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS) || 2048,

  // Security Configuration
  HELMET_OPTIONS: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
  LOG_FILE: process.env.LOG_FILE || 'logs/admin.log',

  // Pagination Defaults
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE) || 100,

  // Cache Configuration
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
  REDIS_URL: process.env.REDIS_URL || null,

  // Development flags
  isDevelopment: () => environment.NODE_ENV === 'development',
  isProduction: () => environment.NODE_ENV === 'production',
  isTest: () => environment.NODE_ENV === 'test',
};

// Validate required environment variables
const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  if (environment.isProduction()) {
    process.exit(1);
  }
}

module.exports = environment;