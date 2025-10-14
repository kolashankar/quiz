const express = require('express');
const { getPrisma } = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

const router = express.Router();
router.use(adminMiddleware);

// Bulk edit questions
router.post('/questions/edit', async (req, res) => {
  try {
    const { questionIds, updates } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Question IDs array is required' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Updates object is required' });
    }

    const prisma = getPrisma();

    // Allowed fields to update
    const allowedFields = ['difficulty', 'tags', 'marks', 'negativeMarks', 'timeLimit', 'isActive'];
    const updateData = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update all questions
    const result = await prisma.question.updateMany({
      where: {
        id: { in: questionIds }
      },
      data: updateData
    });

    res.json({
      success: true,
      message: `${result.count} questions updated successfully`,
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Bulk edit error:', error);
    res.status(500).json({ error: 'Failed to bulk edit questions' });
  }
});

// Bulk delete questions with filters
router.post('/questions/delete', async (req, res) => {
  try {
    const { questionIds, filters } = req.body;

    if (!questionIds && !filters) {
      return res.status(400).json({ error: 'Either questionIds or filters are required' });
    }

    const prisma = getPrisma();

    let whereClause = {};

    if (questionIds && Array.isArray(questionIds)) {
      whereClause.id = { in: questionIds };
    } else if (filters) {
      // Build filter query
      if (filters.difficulty) {
        whereClause.difficulty = filters.difficulty;
      }
      if (filters.subsectionId) {
        whereClause.subsectionId = filters.subsectionId;
      }
      if (filters.tags && Array.isArray(filters.tags)) {
        whereClause.tags = { hasSome: filters.tags };
      }
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      if (filters.createdBefore) {
        whereClause.createdAt = { lt: new Date(filters.createdBefore) };
      }
      if (filters.createdAfter) {
        whereClause.createdAt = { gt: new Date(filters.createdAfter) };
      }
    }

    // First, get count
    const count = await prisma.question.count({ where: whereClause });

    if (count === 0) {
      return res.json({
        success: true,
        message: 'No questions found matching criteria',
        deletedCount: 0
      });
    }

    // Delete questions
    const result = await prisma.question.deleteMany({
      where: whereClause
    });

    res.json({
      success: true,
      message: `${result.count} questions deleted successfully`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete questions' });
  }
});

// Bulk export questions
router.get('/questions/export', async (req, res) => {
  try {
    const { 
      format = 'csv',
      difficulty,
      subsectionId,
      examId,
      subjectId,
      tags
    } = req.query;

    const prisma = getPrisma();

    // Build query
    let whereClause = {};
    if (difficulty) whereClause.difficulty = difficulty;
    if (subsectionId) whereClause.subsectionId = subsectionId;
    if (tags) whereClause.tags = { hasSome: tags.split(',') };

    // Fetch questions with full hierarchy
    const questions = await prisma.question.findMany({
      where: whereClause,
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
      }
    });

    // Filter by exam/subject if provided
    let filteredQuestions = questions;
    if (examId) {
      filteredQuestions = questions.filter(q => 
        q.subsection.section.subtopic.topic.chapter.subject.exam.id === examId
      );
    }
    if (subjectId) {
      filteredQuestions = questions.filter(q => 
        q.subsection.section.subtopic.topic.chapter.subject.id === subjectId
      );
    }

    if (filteredQuestions.length === 0) {
      return res.status(404).json({ error: 'No questions found matching criteria' });
    }

    // Format data for export
    const exportData = filteredQuestions.map(q => ({
      id: q.id,
      exam: q.subsection.section.subtopic.topic.chapter.subject.exam.name,
      subject: q.subsection.section.subtopic.topic.chapter.subject.name,
      chapter: q.subsection.section.subtopic.topic.chapter.name,
      topic: q.subsection.section.subtopic.topic.name,
      subtopic: q.subsection.section.subtopic.name,
      section: q.subsection.section.name,
      subsection: q.subsection.name,
      question_text: q.text,
      option_a: q.options[0] || '',
      option_b: q.options[1] || '',
      option_c: q.options[2] || '',
      option_d: q.options[3] || '',
      correct_answer: q.correctAnswer,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
      tags: q.tags.join(', '),
      marks: q.marks,
      negative_marks: q.negativeMarks || 0,
      time_limit: q.timeLimit || 60
    }));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=questions_export.json');
      return res.json(exportData);
    }

    // CSV export
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `questions_export_${Date.now()}.csv`;
    const filepath = path.join(uploadsDir, filename);

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'exam', title: 'Exam' },
        { id: 'subject', title: 'Subject' },
        { id: 'chapter', title: 'Chapter' },
        { id: 'topic', title: 'Topic' },
        { id: 'subtopic', title: 'Subtopic' },
        { id: 'section', title: 'Section' },
        { id: 'subsection', title: 'Subsection' },
        { id: 'question_text', title: 'Question' },
        { id: 'option_a', title: 'Option A' },
        { id: 'option_b', title: 'Option B' },
        { id: 'option_c', title: 'Option C' },
        { id: 'option_d', title: 'Option D' },
        { id: 'correct_answer', title: 'Correct Answer (0-3)' },
        { id: 'difficulty', title: 'Difficulty' },
        { id: 'explanation', title: 'Explanation' },
        { id: 'tags', title: 'Tags' },
        { id: 'marks', title: 'Marks' },
        { id: 'negative_marks', title: 'Negative Marks' },
        { id: 'time_limit', title: 'Time Limit (seconds)' }
      ]
    });

    await csvWriter.writeRecords(exportData);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }, 10000);
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export questions' });
  }
});

// Batch update operations
router.post('/questions/batch-update', async (req, res) => {
  try {
    const { operations } = req.body;

    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({ error: 'Operations array is required' });
    }

    const prisma = getPrisma();

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each operation
    for (const op of operations) {
      try {
        const { questionId, updates } = op;

        if (!questionId || !updates) {
          results.push({
            questionId,
            success: false,
            error: 'Missing questionId or updates'
          });
          failureCount++;
          continue;
        }

        // Allowed fields
        const allowedFields = ['difficulty', 'tags', 'marks', 'negativeMarks', 'timeLimit', 'isActive', 'text', 'options', 'correctAnswer', 'explanation'];
        const updateData = {};

        for (const [key, value] of Object.entries(updates)) {
          if (allowedFields.includes(key)) {
            updateData[key] = value;
          }
        }

        if (Object.keys(updateData).length === 0) {
          results.push({
            questionId,
            success: false,
            error: 'No valid fields to update'
          });
          failureCount++;
          continue;
        }

        await prisma.question.update({
          where: { id: questionId },
          data: updateData
        });

        results.push({
          questionId,
          success: true
        });
        successCount++;
      } catch (error) {
        results.push({
          questionId: op.questionId,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    res.json({
      success: true,
      message: `Batch update completed: ${successCount} succeeded, ${failureCount} failed`,
      successCount,
      failureCount,
      results
    });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({ error: 'Failed to batch update questions' });
  }
});

// Get bulk operation statistics
router.get('/statistics', async (req, res) => {
  try {
    const prisma = getPrisma();

    const [
      totalQuestions,
      activeQuestions,
      inactiveQuestions,
      easyQuestions,
      mediumQuestions,
      hardQuestions
    ] = await Promise.all([
      prisma.question.count(),
      prisma.question.count({ where: { isActive: true } }),
      prisma.question.count({ where: { isActive: false } }),
      prisma.question.count({ where: { difficulty: 'easy' } }),
      prisma.question.count({ where: { difficulty: 'medium' } }),
      prisma.question.count({ where: { difficulty: 'hard' } })
    ]);

    res.json({
      totalQuestions,
      activeQuestions,
      inactiveQuestions,
      byDifficulty: {
        easy: easyQuestions,
        medium: mediumQuestions,
        hard: hardQuestions
      }
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
