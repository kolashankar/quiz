const express = require('express');
const { body, validationResult } = require('express-validator');
const databaseConfig = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Get all topics
router.get('/', async (req, res) => {
  try {
    const { chapterId } = req.query;
    const prisma = databaseConfig.getInstance();
    
    const where = chapterId ? { chapterId } : {};
    
    const topics = await prisma.topic.findMany({
      where,
      include: {
        chapter: { include: { subject: { include: { exam: true } } } },
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
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(topics);
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get topic by ID
router.get('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    const topic = await prisma.topic.findUnique({
      where: { id: req.params.id },
      include: {
        chapter: { include: { subject: { include: { exam: true } } } },
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
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create topic
router.post('/', [
  body('name').isLength({ min: 2 }),
  body('code').isLength({ min: 2 }),
  body('chapterId').notEmpty(),
  body('order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, chapterId, description, order = 0, isActive = true } = req.body;
    const prisma = databaseConfig.getInstance();

    const topic = await prisma.topic.create({
      data: {
        name,
        code: code.toUpperCase(),
        chapterId,
        description,
        order,
        isActive
      },
      include: { chapter: { include: { subject: { include: { exam: true } } } } }
    });

    res.status(201).json(topic);
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update topic
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

    const topic = await prisma.topic.update({
      where: { id: req.params.id },
      data: updateData,
      include: { chapter: { include: { subject: { include: { exam: true } } } } }
    });

    res.json(topic);
  } catch (error) {
    console.error('Update topic error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete topic
router.delete('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    
    await prisma.topic.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Delete topic error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;