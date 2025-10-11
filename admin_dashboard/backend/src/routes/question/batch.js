const express = require('express');
const databaseConfig = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();
router.use(adminMiddleware);

// Batch delete questions
router.delete('/', [
  body('ids').isArray().withMessage('IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ids } = req.body;
    const prisma = databaseConfig.getInstance();

    const result = await prisma.question.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    res.json({ 
      message: `Deleted ${result.count} questions`,
      count: result.count 
    });
  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Batch update questions
router.patch('/', [
  body('ids').isArray().withMessage('IDs must be an array'),
  body('updates').isObject().withMessage('Updates must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ids, updates } = req.body;
    const prisma = databaseConfig.getInstance();

    // Filter out invalid fields
    const allowedFields = ['difficulty', 'timeLimit', 'marks', 'negativeMarks', 'isActive', 'tags'];
    const filteredUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    const result = await prisma.question.updateMany({
      where: {
        id: { in: ids }
      },
      data: filteredUpdates
    });

    res.json({ 
      message: `Updated ${result.count} questions`,
      count: result.count 
    });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export questions to CSV
router.post('/export', [
  body('ids').isArray().withMessage('IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ids } = req.body;
    const prisma = databaseConfig.getInstance();

    const questions = await prisma.question.findMany({
      where: {
        id: { in: ids }
      },
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
                              include: {
                                exam: true
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
        }
      }
    });

    // Convert to CSV format
    const csvHeader = 'ID,Question,Option1,Option2,Option3,Option4,Correct Answer,Difficulty,Tags,Explanation,Time Limit,Marks,Exam,Subject,Chapter,Topic,Subtopic,Section,Subsection\n';
    
    const csvRows = questions.map(q => {
      const row = [
        q.id,
        `"${q.text.replace(/"/g, '""')}"`,
        `"${q.options[0]?.replace(/"/g, '""') || ''}"`,
        `"${q.options[1]?.replace(/"/g, '""') || ''}"`,
        `"${q.options[2]?.replace(/"/g, '""') || ''}"`,
        `"${q.options[3]?.replace(/"/g, '""') || ''}"`,
        q.correctAnswer,
        q.difficulty,
        `"${q.tags.join(', ')}"`,
        `"${q.explanation?.replace(/"/g, '""') || ''}"`,
        q.timeLimit || 60,
        q.marks || 1,
        q.subsection?.section?.subtopic?.topic?.chapter?.subject?.exam?.name || '',
        q.subsection?.section?.subtopic?.topic?.chapter?.subject?.name || '',
        q.subsection?.section?.subtopic?.topic?.chapter?.name || '',
        q.subsection?.section?.subtopic?.topic?.name || '',
        q.subsection?.section?.subtopic?.name || '',
        q.subsection?.section?.name || '',
        q.subsection?.name || ''
      ];
      return row.join(',');
    });

    const csvContent = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="questions_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;