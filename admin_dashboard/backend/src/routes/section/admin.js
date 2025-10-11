const express = require('express');
const { body, validationResult } = require('express-validator');
const databaseConfig = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Get all sections
router.get('/', async (req, res) => {
  try {
    const { subtopicId } = req.query;
    const prisma = databaseConfig.getInstance();
    
    const where = subtopicId ? { subtopicId } : {};
    
    const sections = await prisma.section.findMany({
      where,
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
        },
        subsections: {
          include: { questions: true }
        }
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(sections);
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get section by ID
router.get('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    const section = await prisma.section.findUnique({
      where: { id: req.params.id },
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
        },
        subsections: {
          include: { questions: true }
        }
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json(section);
  } catch (error) {
    console.error('Get section error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create section
router.post('/', [
  body('name').isLength({ min: 2 }),
  body('code').isLength({ min: 2 }),
  body('subtopicId').notEmpty(),
  body('order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, subtopicId, description, order = 0, isActive = true } = req.body;
    const prisma = databaseConfig.getInstance();

    const section = await prisma.section.create({
      data: {
        name,
        code: code.toUpperCase(),
        subtopicId,
        description,
        order,
        isActive
      },
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
    });

    res.status(201).json(section);
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update section
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

    const section = await prisma.section.update({
      where: { id: req.params.id },
      data: updateData,
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
    });

    res.json(section);
  } catch (error) {
    console.error('Update section error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Section not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete section
router.delete('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    
    await prisma.section.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Section not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;