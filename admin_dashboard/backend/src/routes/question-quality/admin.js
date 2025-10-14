const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPrisma } = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Get review queue (recently added questions)
router.get('/review-queue', async (req, res) => {
  try {
    const { limit = 20, status = 'pending' } = req.query;
    const prisma = getPrisma();

    // Get recently created questions that haven't been reviewed
    const questions = await prisma.question.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    // Get test result statistics for each question
    const questionsWithStats = await Promise.all(
      questions.map(async (q) => {
        const testResults = await prisma.testResult.findMany({
          where: {
            questions: { has: q.id }
          }
        });

        let attemptCount = 0;
        let correctCount = 0;

        testResults.forEach(result => {
          const questionIndex = result.questions.indexOf(q.id);
          if (questionIndex !== -1) {
            attemptCount++;
            if (result.answers[questionIndex] === q.correctAnswer) {
              correctCount++;
            }
          }
        });

        const successRate = attemptCount > 0 ? (correctCount / attemptCount) * 100 : 0;

        return {
          ...q,
          statistics: {
            attemptCount,
            correctCount,
            successRate: successRate.toFixed(2)
          }
        };
      })
    );

    res.json({
      questions: questionsWithStats,
      total: questionsWithStats.length
    });
  } catch (error) {
    console.error('Review queue error:', error);
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

// Flag a question
router.post('/flag', async (req, res) => {
  try {
    const { questionId, reason, description } = req.body;

    if (!questionId || !reason) {
      return res.status(400).json({ error: 'Question ID and reason are required' });
    }

    const prisma = getPrisma();

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Create flagged question entry
    const flagged = await prisma.flaggedQuestion.create({
      data: {
        questionId,
        userId: req.user.userId,
        reason,
        description,
        status: 'pending'
      }
    });

    res.json({
      success: true,
      message: 'Question flagged successfully',
      flagged
    });
  } catch (error) {
    console.error('Flag question error:', error);
    res.status(500).json({ error: 'Failed to flag question' });
  }
});

// Get flagged questions
router.get('/flagged', async (req, res) => {
  try {
    const { status = 'pending', limit = 50 } = req.query;
    const prisma = getPrisma();

    const whereClause = status !== 'all' ? { status } : {};

    const flaggedQuestions = await prisma.flaggedQuestion.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    // Fetch full question details
    const questionsWithDetails = await Promise.all(
      flaggedQuestions.map(async (flag) => {
        const question = await prisma.question.findUnique({
          where: { id: flag.questionId },
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

        return {
          ...flag,
          question
        };
      })
    );

    res.json({
      flaggedQuestions: questionsWithDetails,
      total: questionsWithDetails.length
    });
  } catch (error) {
    console.error('Get flagged questions error:', error);
    res.status(500).json({ error: 'Failed to fetch flagged questions' });
  }
});

// Update flagged question status
router.put('/flagged/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const prisma = getPrisma();

    const updated = await prisma.flaggedQuestion.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedBy: req.user.userId
      }
    });

    res.json({
      success: true,
      message: 'Flagged question updated',
      flagged: updated
    });
  } catch (error) {
    console.error('Update flagged question error:', error);
    res.status(500).json({ error: 'Failed to update flagged question' });
  }
});

// Auto-adjust difficulty based on performance
router.post('/auto-adjust-difficulty', async (req, res) => {
  try {
    const { questionId, minAttempts = 10 } = req.body;
    const prisma = getPrisma();

    let questionsToAdjust = [];

    if (questionId) {
      // Adjust specific question
      const question = await prisma.question.findUnique({
        where: { id: questionId }
      });
      if (question) {
        questionsToAdjust.push(question);
      }
    } else {
      // Adjust all questions with sufficient attempts
      questionsToAdjust = await prisma.question.findMany({
        where: {
          isActive: true
        }
      });
    }

    const adjustments = [];

    for (const question of questionsToAdjust) {
      // Get test results for this question
      const testResults = await prisma.testResult.findMany({
        where: {
          questions: { has: question.id }
        }
      });

      let attemptCount = 0;
      let correctCount = 0;

      testResults.forEach(result => {
        const questionIndex = result.questions.indexOf(question.id);
        if (questionIndex !== -1) {
          attemptCount++;
          if (result.answers[questionIndex] === question.correctAnswer) {
            correctCount++;
          }
        }
      });

      // Only adjust if we have enough attempts
      if (attemptCount < minAttempts) {
        continue;
      }

      const successRate = (correctCount / attemptCount) * 100;
      let newDifficulty = question.difficulty;
      let shouldUpdate = false;

      // Adjustment logic:
      // Success rate > 80% -> Easy
      // Success rate 50-80% -> Medium
      // Success rate < 50% -> Hard

      if (successRate > 80 && question.difficulty !== 'easy') {
        newDifficulty = 'easy';
        shouldUpdate = true;
      } else if (successRate >= 50 && successRate <= 80 && question.difficulty !== 'medium') {
        newDifficulty = 'medium';
        shouldUpdate = true;
      } else if (successRate < 50 && question.difficulty !== 'hard') {
        newDifficulty = 'hard';
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        // Update question difficulty
        await prisma.question.update({
          where: { id: question.id },
          data: { difficulty: newDifficulty }
        });

        // Log the change
        await prisma.questionDifficultyLog.create({
          data: {
            questionId: question.id,
            oldDifficulty: question.difficulty,
            newDifficulty,
            reason: 'Auto-adjusted based on success rate',
            successRate,
            attemptCount,
            adjustedBy: 'system'
          }
        });

        adjustments.push({
          questionId: question.id,
          oldDifficulty: question.difficulty,
          newDifficulty,
          successRate: successRate.toFixed(2),
          attemptCount
        });
      }
    }

    res.json({
      success: true,
      message: `${adjustments.length} questions adjusted`,
      adjustedCount: adjustments.length,
      adjustments
    });
  } catch (error) {
    console.error('Auto-adjust difficulty error:', error);
    res.status(500).json({ error: 'Failed to auto-adjust difficulty' });
  }
});

// Detect duplicate questions using AI
router.post('/detect-duplicates', async (req, res) => {
  try {
    const { subsectionId, examId, threshold = 0.8 } = req.body;
    const prisma = getPrisma();

    // Build query
    let whereClause = {};
    if (subsectionId) {
      whereClause.subsectionId = subsectionId;
    }

    // Fetch questions
    let questions = await prisma.question.findMany({
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

    // Filter by exam if provided
    if (examId) {
      questions = questions.filter(q => 
        q.subsection.section.subtopic.topic.chapter.subject.exam.id === examId
      );
    }

    if (questions.length < 2) {
      return res.json({
        duplicates: [],
        message: 'Not enough questions to check for duplicates'
      });
    }

    // Use AI to detect duplicates
    const questionTexts = questions.map((q, idx) => `${idx}: ${q.text}`).join('\n\n');
    
    const prompt = `Analyze these questions and identify potential duplicates or very similar questions.
Consider semantic similarity, not just exact text matching.

Questions:
${questionTexts}

Return a JSON array of duplicate groups. Each group should contain the indices of similar questions and a similarity score (0-1).
Format: [{"indices": [0, 1], "similarityScore": 0.9, "reason": "Both ask about the same concept"}]

Only include groups with similarity score >= ${threshold}.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Extract JSON from response
      let duplicates = [];
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          duplicates = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }

      // Map indices to actual question IDs and details
      const duplicateGroups = duplicates.map(group => ({
        ...group,
        questions: group.indices.map(idx => ({
          id: questions[idx].id,
          text: questions[idx].text,
          difficulty: questions[idx].difficulty,
          exam: questions[idx].subsection.section.subtopic.topic.chapter.subject.exam.name,
          subject: questions[idx].subsection.section.subtopic.topic.chapter.subject.name
        }))
      }));

      res.json({
        success: true,
        duplicateGroups,
        totalGroups: duplicateGroups.length,
        questionsAnalyzed: questions.length
      });
    } catch (aiError) {
      console.error('AI duplicate detection error:', aiError);
      res.status(500).json({ error: 'AI processing failed', details: aiError.message });
    }
  } catch (error) {
    console.error('Detect duplicates error:', error);
    res.status(500).json({ error: 'Failed to detect duplicates' });
  }
});

// Get difficulty adjustment logs
router.get('/difficulty-logs', async (req, res) => {
  try {
    const { questionId, limit = 50 } = req.query;
    const prisma = getPrisma();

    const whereClause = questionId ? { questionId } : {};

    const logs = await prisma.questionDifficultyLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({
      logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Get difficulty logs error:', error);
    res.status(500).json({ error: 'Failed to fetch difficulty logs' });
  }
});

// Quality score for questions
router.get('/quality-score/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const prisma = getPrisma();

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Calculate quality score based on various factors
    let qualityScore = 0;
    const factors = [];

    // Factor 1: Has explanation (20 points)
    if (question.explanation && question.explanation.length > 20) {
      qualityScore += 20;
      factors.push({ name: 'Has detailed explanation', points: 20 });
    }

    // Factor 2: Has tags (10 points)
    if (question.tags && question.tags.length > 0) {
      qualityScore += 10;
      factors.push({ name: 'Has tags', points: 10 });
    }

    // Factor 3: Options quality (20 points)
    if (question.options && question.options.length === 4) {
      const avgLength = question.options.reduce((sum, opt) => sum + opt.length, 0) / 4;
      if (avgLength > 5) {
        qualityScore += 20;
        factors.push({ name: 'Quality options', points: 20 });
      }
    }

    // Factor 4: Performance data (30 points)
    const testResults = await prisma.testResult.findMany({
      where: {
        questions: { has: questionId }
      }
    });

    let attemptCount = 0;
    let correctCount = 0;

    testResults.forEach(result => {
      const questionIndex = result.questions.indexOf(questionId);
      if (questionIndex !== -1) {
        attemptCount++;
        if (result.answers[questionIndex] === question.correctAnswer) {
          correctCount++;
        }
      }
    });

    if (attemptCount > 10) {
      const successRate = (correctCount / attemptCount) * 100;
      // Ideal success rate is 50-70%
      if (successRate >= 40 && successRate <= 80) {
        qualityScore += 30;
        factors.push({ name: 'Good success rate', points: 30 });
      } else if (successRate >= 20 && successRate < 90) {
        qualityScore += 15;
        factors.push({ name: 'Acceptable success rate', points: 15 });
      }
    }

    // Factor 5: Not flagged (20 points)
    const flags = await prisma.flaggedQuestion.count({
      where: {
        questionId,
        status: { in: ['pending', 'resolved'] }
      }
    });

    if (flags === 0) {
      qualityScore += 20;
      factors.push({ name: 'No flags', points: 20 });
    }

    res.json({
      questionId,
      qualityScore,
      maxScore: 100,
      grade: qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : qualityScore >= 40 ? 'Fair' : 'Needs Improvement',
      factors,
      statistics: {
        attemptCount,
        correctCount,
        successRate: attemptCount > 0 ? ((correctCount / attemptCount) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Quality score error:', error);
    res.status(500).json({ error: 'Failed to calculate quality score' });
  }
});

module.exports = router;
