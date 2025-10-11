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

module.exports = router;