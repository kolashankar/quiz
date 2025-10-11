const express = require('express');
const { body, validationResult } = require('express-validator');
const databaseConfig = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

const router = express.Router();
router.use(adminMiddleware);

// Import batch routes
const batchRoutes = require('./batch');
router.use('/batch', batchRoutes);

// Configure multer for file uploads
const upload = multer({ 
  dest: path.join(__dirname, '../../../uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all questions
router.get('/', async (req, res) => {
  try {
    const { subsectionId, difficulty, page = 1, limit = 20 } = req.query;
    const prisma = databaseConfig.getInstance();
    
    const where = {};
    if (subsectionId) where.subsectionId = subsectionId;
    if (difficulty) where.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          subsection: {
            include: {
              section: {
                include: {
                  subtopic: {
                    include: {
                      topic: { 
                        include: { 
                          chapter: { 
                            include: { 
                              subject: { 
                                include: { exam: true } 
                              } 
                            } 
                          } 
                        } 
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.question.count({ where })
    ]);

    res.json({
      questions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create question
router.post('/', [
  body('text').isLength({ min: 10 }),
  body('options').isArray({ min: 4, max: 4 }),
  body('correctAnswer').isInt({ min: 0, max: 3 }),
  body('subsectionId').notEmpty(),
  body('difficulty').isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      text,
      options,
      correctAnswer,
      explanation,
      difficulty,
      tags = [],
      timeLimit = 60,
      marks = 1,
      negativeMarks = 0,
      subsectionId,
      isActive = true
    } = req.body;

    const prisma = databaseConfig.getInstance();

    const question = await prisma.question.create({
      data: {
        text,
        options,
        correctAnswer,
        explanation,
        difficulty,
        tags,
        timeLimit,
        marks,
        negativeMarks,
        subsectionId,
        isActive
      }
    });

    res.status(201).json(question);
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update question
router.put('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(question);
  } catch (error) {
    console.error('Update question error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Batch update questions
router.post('/batch', async (req, res) => {
  try {
    const { ids, updates } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid ids array' });
    }

    const prisma = databaseConfig.getInstance();
    
    // Update all questions with the given IDs
    const result = await prisma.question.updateMany({
      where: { id: { in: ids } },
      data: updates
    });

    res.json({ 
      message: `${result.count} question(s) updated successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Batch delete questions
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid ids array' });
    }

    const prisma = databaseConfig.getInstance();
    const result = await prisma.question.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({ 
      message: `${result.count} question(s) deleted successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// CSV Bulk Upload
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { subsectionId } = req.body;
    if (!subsectionId) {
      return res.status(400).json({ error: 'subsectionId is required' });
    }

    const results = [];
    const errors = [];
    
    // Read and parse CSV file
    const stream = fs.createReadStream(req.file.path)
      .pipe(csvParser());

    for await (const row of stream) {
      try {
        // Parse CSV row
        const question = {
          text: row.question || row.text,
          options: [
            row.option1 || row.optionA,
            row.option2 || row.optionB,
            row.option3 || row.optionC,
            row.option4 || row.optionD
          ],
          correctAnswer: parseInt(row.correctAnswer || row.correct_answer) || 0,
          explanation: row.explanation || '',
          difficulty: row.difficulty || 'medium',
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
          timeLimit: parseInt(row.timeLimit || row.time_limit) || 60,
          marks: parseInt(row.marks) || 1,
          negativeMarks: parseFloat(row.negativeMarks || row.negative_marks) || 0,
          subsectionId,
          isActive: row.isActive !== 'false'
        };

        // Validate required fields
        if (!question.text || question.options.some(opt => !opt)) {
          errors.push({ row, error: 'Missing required fields' });
          continue;
        }

        // Create question
        const prisma = databaseConfig.getInstance();
        const created = await prisma.question.create({ data: question });
        results.push(created);
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      created: results.length,
      errors: errors.length,
      results,
      errorDetails: errors
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Server error during CSV upload' });
  }
});

// Download CSV template
router.get('/csv-template', (req, res) => {
  const template = `question,option1,option2,option3,option4,correctAnswer,explanation,difficulty,tags,timeLimit,marks,negativeMarks
"What is 2+2?",2,3,4,5,2,"Simple addition",easy,"math,basic",60,1,0
"Capital of France?",London,Paris,Berlin,Rome,1,"Paris is the capital",medium,"geography",90,2,0.5`;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=questions_template.csv');
  res.send(template);
});

module.exports = router;