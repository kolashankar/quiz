const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const databaseConfig = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();

    // Get counts for all entities
    const [
      totalUsers,
      totalExams,
      totalSubjects,
      totalChapters,
      totalTopics,
      totalSubtopics,
      totalSections,
      totalSubsections,
      totalQuestions,
      totalTests
    ] = await Promise.all([
      prisma.user.count(),
      prisma.exam.count(),
      prisma.subject.count(),
      prisma.chapter.count(),
      prisma.topic.count(),
      prisma.subtopic.count(),
      prisma.section.count(),
      prisma.subsection.count(),
      prisma.question.count(),
      prisma.testResult.count()
    ]);

    // Get recent activity
    const recentQuestions = await prisma.question.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
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

    // Question difficulty distribution
    const difficultyStats = await prisma.question.groupBy({
      by: ['difficulty'],
      _count: {
        id: true
      }
    });

    // Questions per exam
    const examStats = await prisma.exam.findMany({
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
                                _count: {
                                  select: { questions: true }
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
      }
    });

    // Calculate questions per exam
    const examQuestionCounts = examStats.map(exam => {
      let totalQuestions = 0;
      exam.subjects.forEach(subject => {
        subject.chapters.forEach(chapter => {
          chapter.topics.forEach(topic => {
            topic.subtopics.forEach(subtopic => {
              subtopic.sections.forEach(section => {
                section.subsections.forEach(subsection => {
                  totalQuestions += subsection._count.questions;
                });
              });
            });
          });
        });
      });
      return {
        examName: exam.name,
        questionCount: totalQuestions
      };
    });

    res.json({
      overview: {
        totalUsers,
        totalExams,
        totalSubjects,
        totalChapters,
        totalTopics,
        totalSubtopics,
        totalSections,
        totalSubsections,
        totalQuestions,
        totalTests
      },
      recentActivity: recentQuestions,
      statistics: {
        difficultyDistribution: difficultyStats,
        questionsPerExam: examQuestionCounts
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// AI-powered content suggestions
router.post('/ai-suggestions', async (req, res) => {
  try {
    const { type, context } = req.body; // type: 'question', 'topic', 'improvement'
    
    const prisma = databaseConfig.getInstance();

    let prompt = '';
    let data = {};

    switch (type) {
      case 'question':
        // Get context from subsection
        if (context.subsectionId) {
          const subsection = await prisma.subsection.findUnique({
            where: { id: context.subsectionId },
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

          prompt = `Generate 3 multiple-choice questions for:
Exam: ${subsection.section.subtopic.topic.chapter.subject.exam.name}
Subject: ${subsection.section.subtopic.topic.chapter.subject.name}
Chapter: ${subsection.section.subtopic.topic.chapter.name}
Topic: ${subsection.section.subtopic.topic.name}
Subtopic: ${subsection.section.subtopic.name}
Section: ${subsection.section.name}
Subsection: ${subsection.name}

Each question should have:
- Clear, concise question text
- 4 options (A, B, C, D)
- Correct answer indication
- Brief explanation
- Difficulty level (easy/medium/hard)

Format as JSON array.`;
        }
        break;

      case 'content-analysis':
        // Analyze content gaps
        const contentStats = await prisma.exam.findMany({
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
                                    _count: { select: { questions: true } }
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

        prompt = `Analyze this exam content structure and suggest improvements:
${JSON.stringify(contentStats, null, 2)}

Identify:
1. Content gaps (topics with few questions)
2. Balance issues (uneven question distribution)
3. Missing difficulty levels
4. Suggestions for new topics/subtopics

Provide actionable recommendations.`;
        break;

      case 'performance-insights':
        // Get test performance data
        const performanceData = await prisma.testResult.findMany({
          include: {
            user: { select: { email: true, role: true } }
          }
        });

        prompt = `Analyze test performance data and provide insights:
${JSON.stringify(performanceData, null, 2)}

Provide:
1. Overall performance trends
2. Difficult question patterns
3. User engagement insights
4. Recommendations for content improvement`;
        break;
    }

    if (prompt) {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      data.aiSuggestions = response.text();
    }

    res.json({
      type,
      suggestions: data.aiSuggestions || 'No suggestions available',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Content hierarchy analytics
router.get('/hierarchy', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();

    const hierarchyData = await prisma.exam.findMany({
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
                                _count: { select: { questions: true } }
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

    res.json(hierarchyData);
  } catch (error) {
    console.error('Hierarchy analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================
// ADVANCED ANALYTICS
// ===================

// User engagement metrics
router.get('/user-engagement', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const prisma = databaseConfig.getInstance();
    
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Active users (users who took tests in the period)
    const activeUsers = await prisma.testResult.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });

    // New users in period
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });

    // Total users
    const totalUsers = await prisma.user.count();

    // Daily active users trend
    const dailyActivity = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTests = await prisma.testResult.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      const dayActiveUsers = await prisma.testResult.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      dailyActivity.push({
        date: dayStart.toISOString().split('T')[0],
        testsCount: dayTests,
        activeUsers: dayActiveUsers.length
      });
    }

    // Average tests per user
    const allTests = await prisma.testResult.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });

    const avgTestsPerUser = activeUsers.length > 0 ? (allTests / activeUsers.length).toFixed(2) : 0;

    // Retention rate (users who came back after first test)
    const usersWithMultipleTests = await prisma.testResult.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      having: {
        userId: {
          _count: {
            gt: 1
          }
        }
      }
    });

    const retentionRate = activeUsers.length > 0 
      ? ((usersWithMultipleTests.length / activeUsers.length) * 100).toFixed(2)
      : 0;

    res.json({
      period: `${daysAgo} days`,
      totalUsers,
      activeUsers: activeUsers.length,
      newUsers,
      avgTestsPerUser: parseFloat(avgTestsPerUser),
      retentionRate: parseFloat(retentionRate),
      dailyActivity,
      engagementScore: {
        active: ((activeUsers.length / totalUsers) * 100).toFixed(2),
        retention: retentionRate
      }
    });
  } catch (error) {
    console.error('User engagement error:', error);
    res.status(500).json({ error: 'Failed to fetch user engagement metrics' });
  }
});

// Question difficulty analysis
router.get('/question-difficulty-analysis', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();

    // Get all questions with their test results
    const questions = await prisma.question.findMany({
      where: {
        isActive: true
      }
    });

    const analysisResults = [];

    for (const question of questions) {
      // Get test results for this question
      const testResults = await prisma.testResult.findMany({
        where: {
          questions: { has: question.id }
        }
      });

      let attemptCount = 0;
      let correctCount = 0;
      let totalTime = 0;

      testResults.forEach(result => {
        const questionIndex = result.questions.indexOf(question.id);
        if (questionIndex !== -1) {
          attemptCount++;
          if (result.answers[questionIndex] === question.correctAnswer) {
            correctCount++;
          }
        }
      });

      if (attemptCount > 0) {
        const successRate = (correctCount / attemptCount) * 100;
        const avgTime = totalTime / attemptCount;

        // Determine if difficulty matches actual performance
        let difficultyMatch = 'correct';
        if (question.difficulty === 'easy' && successRate < 70) {
          difficultyMatch = 'harder_than_marked';
        } else if (question.difficulty === 'hard' && successRate > 60) {
          difficultyMatch = 'easier_than_marked';
        } else if (question.difficulty === 'medium' && (successRate < 40 || successRate > 80)) {
          difficultyMatch = successRate < 40 ? 'harder_than_marked' : 'easier_than_marked';
        }

        analysisResults.push({
          questionId: question.id,
          text: question.text.substring(0, 100) + '...',
          markedDifficulty: question.difficulty,
          attemptCount,
          correctCount,
          successRate: successRate.toFixed(2),
          difficultyMatch,
          suggestedDifficulty: successRate > 80 ? 'easy' : successRate > 50 ? 'medium' : 'hard'
        });
      }
    }

    // Sort by mismatch
    const mismatched = analysisResults.filter(q => q.difficultyMatch !== 'correct');
    
    // Group by difficulty
    const byDifficulty = {
      easy: analysisResults.filter(q => q.markedDifficulty === 'easy'),
      medium: analysisResults.filter(q => q.markedDifficulty === 'medium'),
      hard: analysisResults.filter(q => q.markedDifficulty === 'hard')
    };

    res.json({
      totalQuestionsAnalyzed: analysisResults.length,
      mismatchedQuestions: mismatched.length,
      mismatchedList: mismatched.slice(0, 20), // Top 20
      difficultyBreakdown: {
        easy: {
          count: byDifficulty.easy.length,
          avgSuccessRate: byDifficulty.easy.length > 0 
            ? (byDifficulty.easy.reduce((sum, q) => sum + parseFloat(q.successRate), 0) / byDifficulty.easy.length).toFixed(2)
            : 0
        },
        medium: {
          count: byDifficulty.medium.length,
          avgSuccessRate: byDifficulty.medium.length > 0
            ? (byDifficulty.medium.reduce((sum, q) => sum + parseFloat(q.successRate), 0) / byDifficulty.medium.length).toFixed(2)
            : 0
        },
        hard: {
          count: byDifficulty.hard.length,
          avgSuccessRate: byDifficulty.hard.length > 0
            ? (byDifficulty.hard.reduce((sum, q) => sum + parseFloat(q.successRate), 0) / byDifficulty.hard.length).toFixed(2)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Question difficulty analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze question difficulty' });
  }
});

// Success rate by topic
router.get('/success-rate-by-topic', async (req, res) => {
  try {
    const { examId, subjectId } = req.query;
    const prisma = databaseConfig.getInstance();

    // Get all topics with their hierarchy
    let topics = await prisma.topic.findMany({
      include: {
        chapter: {
          include: {
            subject: {
              include: { exam: true }
            }
          }
        },
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
    });

    // Filter by exam/subject if provided
    if (examId) {
      topics = topics.filter(t => t.chapter.subject.exam.id === examId);
    }
    if (subjectId) {
      topics = topics.filter(t => t.chapter.subject.id === subjectId);
    }

    const topicAnalysis = [];

    for (const topic of topics) {
      // Get all questions under this topic
      const questionIds = [];
      topic.subtopics.forEach(subtopic => {
        subtopic.sections.forEach(section => {
          section.subsections.forEach(subsection => {
            subsection.questions.forEach(q => {
              questionIds.push(q.id);
            });
          });
        });
      });

      if (questionIds.length === 0) continue;

      // Get test results
      const testResults = await prisma.testResult.findMany({
        where: {
          questions: { hasSome: questionIds }
        }
      });

      let totalAttempts = 0;
      let correctAnswers = 0;

      testResults.forEach(result => {
        result.questions.forEach((qId, idx) => {
          if (questionIds.includes(qId)) {
            totalAttempts++;
            const question = topic.subtopics
              .flatMap(st => st.sections)
              .flatMap(sec => sec.subsections)
              .flatMap(sub => sub.questions)
              .find(q => q.id === qId);
            
            if (question && result.answers[idx] === question.correctAnswer) {
              correctAnswers++;
            }
          }
        });
      });

      if (totalAttempts > 0) {
        const successRate = (correctAnswers / totalAttempts) * 100;

        topicAnalysis.push({
          topicId: topic.id,
          topicName: topic.name,
          examName: topic.chapter.subject.exam.name,
          subjectName: topic.chapter.subject.name,
          chapterName: topic.chapter.name,
          totalQuestions: questionIds.length,
          totalAttempts,
          correctAnswers,
          successRate: successRate.toFixed(2),
          difficulty: successRate > 70 ? 'Easy' : successRate > 40 ? 'Medium' : 'Hard'
        });
      }
    }

    // Sort by success rate (ascending - weakest topics first)
    topicAnalysis.sort((a, b) => parseFloat(a.successRate) - parseFloat(b.successRate));

    res.json({
      totalTopics: topicAnalysis.length,
      topics: topicAnalysis,
      weakestTopics: topicAnalysis.slice(0, 10),
      strongestTopics: topicAnalysis.slice(-10).reverse()
    });
  } catch (error) {
    console.error('Success rate by topic error:', error);
    res.status(500).json({ error: 'Failed to fetch success rate by topic' });
  }
});

// Time-based trends
router.get('/time-based-trends', async (req, res) => {
  try {
    const { period = '30', groupBy = 'day' } = req.query; // day, week, month
    const prisma = databaseConfig.getInstance();
    
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all tests in period
    const tests = await prisma.testResult.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group data by time period
    const groupedData = {};
    
    tests.forEach(test => {
      const date = new Date(test.createdAt);
      let key;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          testsCount: 0,
          totalScore: 0,
          totalPercentage: 0,
          uniqueUsers: new Set()
        };
      }

      groupedData[key].testsCount++;
      groupedData[key].totalScore += test.score;
      groupedData[key].totalPercentage += test.percentage;
      groupedData[key].uniqueUsers.add(test.userId);
    });

    // Convert to array and calculate averages
    const trends = Object.values(groupedData).map(group => ({
      date: group.date,
      testsCount: group.testsCount,
      avgScore: (group.totalScore / group.testsCount).toFixed(2),
      avgPercentage: (group.totalPercentage / group.testsCount).toFixed(2),
      uniqueUsers: group.uniqueUsers.size
    }));

    // Calculate overall trend
    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));

    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, t) => sum + parseFloat(t.avgPercentage), 0) / firstHalf.length
      : 0;
    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, t) => sum + parseFloat(t.avgPercentage), 0) / secondHalf.length
      : 0;

    const trend = secondHalfAvg > firstHalfAvg ? 'improving' : secondHalfAvg < firstHalfAvg ? 'declining' : 'stable';
    const trendPercentage = firstHalfAvg > 0
      ? (((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100).toFixed(2)
      : 0;

    res.json({
      period: `${daysAgo} days`,
      groupBy,
      trends,
      summary: {
        totalTests: tests.length,
        avgScore: tests.length > 0 ? (tests.reduce((sum, t) => sum + t.score, 0) / tests.length).toFixed(2) : 0,
        avgPercentage: tests.length > 0 ? (tests.reduce((sum, t) => sum + t.percentage, 0) / tests.length).toFixed(2) : 0,
        trend,
        trendPercentage: parseFloat(trendPercentage)
      }
    });
  } catch (error) {
    console.error('Time-based trends error:', error);
    res.status(500).json({ error: 'Failed to fetch time-based trends' });
  }
});

// Performance distribution
router.get('/performance-distribution', async (req, res) => {
  try {
    const prisma = databaseConfig.getInstance();

    const tests = await prisma.testResult.findMany({
      select: {
        percentage: true
      }
    });

    // Create distribution buckets
    const buckets = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    tests.forEach(test => {
      const p = test.percentage;
      if (p <= 20) buckets['0-20']++;
      else if (p <= 40) buckets['21-40']++;
      else if (p <= 60) buckets['41-60']++;
      else if (p <= 80) buckets['61-80']++;
      else buckets['81-100']++;
    });

    res.json({
      totalTests: tests.length,
      distribution: Object.keys(buckets).map(range => ({
        range,
        count: buckets[range],
        percentage: tests.length > 0 ? ((buckets[range] / tests.length) * 100).toFixed(2) : 0
      }))
    });
  } catch (error) {
    console.error('Performance distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch performance distribution' });
  }
});

module.exports = router;