const express = require('express');
const { body, validationResult } = require('express-validator');
const databaseConfig = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Get all exams
router.get('/', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    const exams = await prisma.exam.findMany({
      include: {
        subjects: {
          include: {
            chapters: {
              include: {
                topics: {
                  include: {
                    subtopics: {
                      include: {
                        sections: {
                          include: {
                            subsections: {
                              include: {
                                questions: true
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
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(exams);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get exam by ID
router.get('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        subjects: {
          include: {
            chapters: {
              include: {
                topics: {
                  include: {
                    subtopics: {
                      include: {
                        sections: {
                          include: {
                            subsections: {
                              include: {
                                questions: true
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

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create exam
router.post('/', [
  body('name').isLength({ min: 2 }),
  body('code').isLength({ min: 2 }),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, description, isActive = true } = req.body;
    const prisma = databaseConfig.getInstance();

    const exam = await prisma.exam.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
        isActive
      }
    });

    res.status(201).json(exam);
  } catch (error) {
    console.error('Create exam error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Exam code already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update exam
router.put('/:id', [
  body('name').optional().isLength({ min: 2 }),
  body('code').optional().isLength({ min: 2 }),
  body('description').optional()
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

    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(exam);
  } catch (error) {
    console.error('Update exam error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Exam not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Exam code already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete exam
router.delete('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    
    await prisma.exam.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Exam not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;