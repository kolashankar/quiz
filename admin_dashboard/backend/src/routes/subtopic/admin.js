const express = require('express');
const { body, validationResult } = require('express-validator');
const databaseConfig = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Get all subtopics
router.get('/', async (req, res) => {
  try {
    const { topicId } = req.query;
    const prisma = databaseConfig.getInstance();
    
    const where = topicId ? { topicId } : {};
    
    const subtopics = await prisma.subtopic.findMany({
      where,
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
        },
        sections: {
          include: {
            subsections: {
              include: { questions: true }
            }
          }
        }
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(subtopics);
  } catch (error) {
    console.error('Get subtopics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get subtopic by ID
router.get('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    const subtopic = await prisma.subtopic.findUnique({
      where: { id: req.params.id },
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
        },
        sections: {
          include: {
            subsections: {
              include: { questions: true }
            }
          }
        }
      }
    });

    if (!subtopic) {
      return res.status(404).json({ error: 'Subtopic not found' });
    }

    res.json(subtopic);
  } catch (error) {
    console.error('Get subtopic error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create subtopic
router.post('/', [
  body('name').isLength({ min: 2 }),
  body('code').isLength({ min: 2 }),
  body('topicId').notEmpty(),
  body('order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, topicId, description, order = 0, isActive = true } = req.body;
    const prisma = databaseConfig.getInstance();

    const subtopic = await prisma.subtopic.create({
      data: {
        name,
        code: code.toUpperCase(),
        topicId,
        description,
        order,
        isActive
      },
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
    });

    res.status(201).json(subtopic);
  } catch (error) {
    console.error('Create subtopic error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update subtopic
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

    const subtopic = await prisma.subtopic.update({
      where: { id: req.params.id },
      data: updateData,
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
    });

    res.json(subtopic);
  } catch (error) {
    console.error('Update subtopic error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Subtopic not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete subtopic
router.delete('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    
    await prisma.subtopic.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Subtopic deleted successfully' });
  } catch (error) {
    console.error('Delete subtopic error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Subtopic not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;