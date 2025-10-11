const express = require('express');
const { body, validationResult } = require('express-validator');
const databaseConfig = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Get all subsections
router.get('/', async (req, res) => {
  try {
    const { sectionId } = req.query;
    const prisma = databaseConfig.getInstance();
    
    const where = sectionId ? { sectionId } : {};
    
    const subsections = await prisma.subsection.findMany({
      where,
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
        },
        questions: true
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(subsections);
  } catch (error) {
    console.error('Get subsections error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get subsection by ID
router.get('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    const subsection = await prisma.subsection.findUnique({
      where: { id: req.params.id },
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
        },
        questions: true
      }
    });

    if (!subsection) {
      return res.status(404).json({ error: 'Subsection not found' });
    }

    res.json(subsection);
  } catch (error) {
    console.error('Get subsection error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create subsection
router.post('/', [
  body('name').isLength({ min: 2 }),
  body('code').isLength({ min: 2 }),
  body('sectionId').notEmpty(),
  body('order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, sectionId, description, order = 0, isActive = true } = req.body;
    const prisma = databaseConfig.getInstance();

    const subsection = await prisma.subsection.create({
      data: {
        name,
        code: code.toUpperCase(),
        sectionId,
        description,
        order,
        isActive
      },
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
    });

    res.status(201).json(subsection);
  } catch (error) {
    console.error('Create subsection error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update subsection
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

    const subsection = await prisma.subsection.update({
      where: { id: req.params.id },
      data: updateData,
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
    });

    res.json(subsection);
  } catch (error) {
    console.error('Update subsection error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Subsection not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete subsection
router.delete('/:id', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();
    
    await prisma.subsection.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Subsection deleted successfully' });
  } catch (error) {
    console.error('Delete subsection error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Subsection not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;