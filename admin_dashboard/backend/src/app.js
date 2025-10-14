const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth/auth');
const examRoutes = require('./routes/exam/admin');
const subjectRoutes = require('./routes/subject/admin');
const chapterRoutes = require('./routes/chapter/admin');
const topicRoutes = require('./routes/topic/admin');
const subtopicRoutes = require('./routes/subtopic/admin');
const sectionRoutes = require('./routes/section/admin');
const subsectionRoutes = require('./routes/subsection/admin');
const questionRoutes = require('./routes/question/admin');
const analyticsRoutes = require('./routes/analytics/admin');
const aiRoutes = require('./routes/ai/ai');
const syllabusRoutes = require('./routes/syllabus/admin');
const notificationRoutes = require('./routes/notification/admin');
const bulkOperationsRoutes = require('./routes/bulk-operations/admin');
const questionQualityRoutes = require('./routes/question-quality/admin');
const communicationRoutes = require('./routes/communication/admin');

// Import middleware
const errorHandler = require('./middleware/error/errorHandler');
const { authMiddleware } = require('./middleware/auth/authMiddleware');

const app = express();
const PORT = process.env.PORT || 8002;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(limiter);
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/exams', authMiddleware, examRoutes);
app.use('/api/admin/subjects', authMiddleware, subjectRoutes);
app.use('/api/admin/chapters', authMiddleware, chapterRoutes);
app.use('/api/admin/topics', authMiddleware, topicRoutes);
app.use('/api/admin/subtopics', authMiddleware, subtopicRoutes);
app.use('/api/admin/sections', authMiddleware, sectionRoutes);
app.use('/api/admin/subsections', authMiddleware, subsectionRoutes);
app.use('/api/admin/questions', authMiddleware, questionRoutes);
app.use('/api/admin/analytics', authMiddleware, analyticsRoutes);
app.use('/api/admin/ai', authMiddleware, aiRoutes);
app.use('/api/admin/syllabus', authMiddleware, syllabusRoutes);
app.use('/api/admin/notifications', authMiddleware, notificationRoutes);
app.use('/api/admin/bulk-operations', authMiddleware, bulkOperationsRoutes);
app.use('/api/admin/question-quality', authMiddleware, questionQualityRoutes);
app.use('/api/admin/communication', authMiddleware, communicationRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database connection and create default admin
async function initializeApp() {
  const databaseConfig = require('./config/database/prisma');
  const bcrypt = require('bcryptjs');
  
  try {
    // Connect to database
    await databaseConfig.connect();
    
    // Create default admin user if not exists
    const prisma = databaseConfig.getInstance();
    const adminEmail = 'admin@quiz.com';
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!existingAdmin) {
      try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: 'Admin User',
            role: 'admin'
          }
        });
        console.log('✅ Default admin user created');
        console.log(`📧 Email: ${adminEmail}`);
        console.log('🔑 Password: admin123');
      } catch (error) {
        // Admin might already exist, continue
        console.log('ℹ️ Admin user already exists or creation failed');
      }
    }
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    process.exit(1);
  }
}

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Quiz Admin Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  
  // Initialize app
  await initializeApp();
});

module.exports = app;