const { PrismaClient } = require('@prisma/client');

class DatabaseConfig {
  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
    console.log('🔌 Database disconnected');
  }

  getInstance() {
    return this.prisma;
  }
}

const databaseConfig = new DatabaseConfig();
module.exports = databaseConfig;