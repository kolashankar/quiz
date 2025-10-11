const express = require('express');
const { body, validationResult } = require('express-validator');
const databaseConfig = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Get all subjects
router.get('/', async (req, res) => {
  try {
    const { examId } = req.query;
    const prisma = databaseConfig.getInstance();
    
    const where = examId ? { examId } : {};
    
    const subjects = await prisma.subject.findMany({
      where,
      include: {
        exam: true,
        chapters: {
          include: {
            topics: {
              include: {
                subtopics: {
                  include: {
                    sections: {
                      include: {
                        subsections: {
                          include: { questions: true }
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
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get subject by ID
router.get('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id },
      include: {
        exam: true,
        chapters: {
          include: {
            topics: {
              include: {
                subtopics: {
                  include: {
                    sections: {
                      include: {
                        subsections: {
                          include: { questions: true }
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

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json(subject);
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create subject
router.post('/', [
  body('name').isLength({ min: 2 }),
  body('code').isLength({ min: 2 }),
  body('examId').notEmpty(),
  body('order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, examId, description, order = 0, isActive = true } = req.body;
    const prisma = databaseConfig.getInstance();

    const subject = await prisma.subject.create({
      data: {
        name,
        code: code.toUpperCase(),
        examId,
        description,
        order,
        isActive
      },
      include: { exam: true }
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update subject
router.put('/:id', [
  body('name').optional().isLength({ min: 2 }),
  body('code').optional().isLength({ min: 2 }),
  body('order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prisma = databaseConfig.getInstance();
    const updateData = { ...req.body };
    
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data: updateData,
      include: { exam: true }
    });

    res.json(subject);
  } catch (error) {
    console.error('Update subject error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete subject
router.delete('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    
    await prisma.subject.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;