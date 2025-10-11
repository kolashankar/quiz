const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');
const { getPrisma } = require('../../config/database/prisma');

const router = express.Router();
router.use(adminMiddleware);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Get all syllabuses or filter by exam
router.get('/', async (req, res) => {
  try {
    const { examId } = req.query;
    const prisma = getPrisma();

    const where = examId ? { examId } : {};
    
    const syllabuses = await prisma.syllabus.findMany({
      where,
      include: {
        exam: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(syllabuses);
  } catch (error) {
    console.error('Get syllabuses error:', error);
    res.status(500).json({ error: 'Failed to fetch syllabuses' });
  }
});

// Get single syllabus
router.get('/:id', async (req, res) => {
  try {
    const prisma = getPrisma();
    const syllabus = await prisma.syllabus.findUnique({
      where: { id: req.params.id },
      include: {
        exam: {
          select: {
            name: true
          }
        }
      }
    });

    if (!syllabus) {
      return res.status(404).json({ error: 'Syllabus not found' });
    }

    res.json(syllabus);
  } catch (error) {
    console.error('Get syllabus error:', error);
    res.status(500).json({ error: 'Failed to fetch syllabus' });
  }
});

// Create syllabus
router.post('/', async (req, res) => {
  try {
    const { examId, title, content, aiGenerated = false } = req.body;

    if (!examId || !title || !content) {
      return res.status(400).json({ error: 'examId, title, and content are required' });
    }

    const prisma = getPrisma();
    const syllabus = await prisma.syllabus.create({
      data: {
        examId,
        title,
        content,
        aiGenerated
      },
      include: {
        exam: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json(syllabus);
  } catch (error) {
    console.error('Create syllabus error:', error);
    res.status(500).json({ error: 'Failed to create syllabus' });
  }
});

// Update syllabus
router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const prisma = getPrisma();

    const syllabus = await prisma.syllabus.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(content && { content })
      },
      include: {
        exam: {
          select: {
            name: true
          }
        }
      }
    });

    res.json(syllabus);
  } catch (error) {
    console.error('Update syllabus error:', error);
    res.status(500).json({ error: 'Failed to update syllabus' });
  }
});

// Delete syllabus
router.delete('/:id', async (req, res) => {
  try {
    const prisma = getPrisma();
    await prisma.syllabus.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Syllabus deleted successfully' });
  } catch (error) {
    console.error('Delete syllabus error:', error);
    res.status(500).json({ error: 'Failed to delete syllabus' });
  }
});

// Generate syllabus using AI
router.post('/generate-ai', async (req, res) => {
  try {
    const { examName, examType } = req.body;

    if (!examName) {
      return res.status(400).json({ error: 'Exam name is required' });
    }

    const prompt = `Generate a comprehensive syllabus for the ${examName} examination${examType ? ` (${examType})` : ''}.

Include the following sections:
1. Exam Overview
   - Purpose and scope of the exam
   - Target audience
   - Exam pattern (if applicable)

2. Subject-wise Breakdown
   - List all major subjects
   - Key topics under each subject
   - Subtopics and important concepts

3. Recommended Study Approach
   - Suggested timeline
   - Priority topics
   - Study strategies

4. Important Areas
   - High-weightage topics
   - Frequently asked concepts
   - Recent trends

Format the response in clear, structured markdown with headings, bullet points, and organized sections.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedContent = response.text();

    res.json({
      success: true,
      examName,
      generatedContent
    });
  } catch (error) {
    console.error('AI syllabus generation error:', error);
    res.status(500).json({ error: 'Failed to generate syllabus', details: error.message });
  }
});

module.exports = router;
