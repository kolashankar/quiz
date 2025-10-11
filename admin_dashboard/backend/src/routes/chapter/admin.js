const express = require('express');
const { body, validationResult } = require('express-validator');
const databaseConfig = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Get all chapters
router.get('/', async (req, res) => {
  try {
    const { subjectId } = req.query;
    const prisma = databaseConfig.getInstance();
    
    const where = subjectId ? { subjectId } : {};
    
    const chapters = await prisma.chapter.findMany({
      where,
      include: {
        subject: { include: { exam: true } },
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
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(chapters);
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get chapter by ID
router.get('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    const chapter = await prisma.chapter.findUnique({
      where: { id: req.params.id },
      include: {
        subject: { include: { exam: true } },
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
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(chapter);
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create chapter
router.post('/', [
  body('name').isLength({ min: 2 }),
  body('code').isLength({ min: 2 }),
  body('subjectId').notEmpty(),
  body('order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, subjectId, description, order = 0, isActive = true } = req.body;
    const prisma = databaseConfig.getInstance();

    const chapter = await prisma.chapter.create({
      data: {
        name,
        code: code.toUpperCase(),
        subjectId,
        description,
        order,
        isActive
      },
      include: { subject: { include: { exam: true } } }
    });

    res.status(201).json(chapter);
  } catch (error) {
    console.error('Create chapter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update chapter
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

    const chapter = await prisma.chapter.update({
      where: { id: req.params.id },
      data: updateData,
      include: { subject: { include: { exam: true } } }
    });

    res.json(chapter);
  } catch (error) {
    console.error('Update chapter error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete chapter
router.delete('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    
    await prisma.chapter.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    console.error('Delete chapter error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;